import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../services/api';

export const useSocket = () => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  
  // Response state
  const [lastResponse, setLastResponse] = useState(null);
  const [socketError, setSocketError] = useState(null);
  
  // Loading state - NOW PROPERLY MANAGED
  const [loadingResponse, setLoadingResponse] = useState(false);
  
  // Reference to socket instance
  const socketRef = useRef(null);
  
  // NEW: Track pending requests for validation
  const pendingRequests = useRef(new Map());
  
  // NEW: Cleanup timeout ref for request timeout protection
  const cleanupIntervalRef = useRef(null);

  /**
   * Connects to Socket.IO server with JWT authentication
   */
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token found. Cannot connect socket.');
      return;
    }

    // Close existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(API_URL, {
      path: '/socket.io',
      auth: { 
        token: token,
        'Access-Token': token 
      },
      extraHeaders: {
        'Access-Token': token,
        'Authorization': `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ========== CONNECTION EVENTS ==========
    
    socket.on('connect', () => {
      console.log('Socket.IO connected, ID:', socket.id);
      setIsConnected(true);
      setSocketId(socket.id);
      setSocketError(null);
      setLoadingResponse(false); // NEW: Clear loading on reconnect
    });

    socket.on('connected', (data) => {
      console.log('Server acknowledged connection:', data);
      if (data && data.sid) {
        setSocketId(data.sid);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected, Reason:', reason);
      setIsConnected(false);
      setSocketId(null);
      setLoadingResponse(false); // NEW: Clear loading on disconnect
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setSocketError('Authentication or connection failed.');
      setIsConnected(false);
      setLoadingResponse(false); // NEW: Clear loading on connection error
    });

    // ========== QUESTION/RESPONSE EVENTS ==========

    socket.on('question_response', (data) => {
      console.log('Received response from server:', data);

      // NEW: Comprehensive response validation
      if (!data || !data.file_id || !data.response) {
        console.error('Invalid response format received:', data);
        setSocketError('Received malformed response from server');
        setLoadingResponse(false);
        return;
      }

      const requestId = data.request_id ? `${data.file_id}-${data.request_id}` : null;
      const isOwnPendingRequest = requestId && pendingRequests.current.has(requestId);

      if (isOwnPendingRequest) {
        pendingRequests.current.delete(requestId);

        if (pendingRequests.current.size === 0) {
          setLoadingResponse(false);
        }
      } else {
        console.log(
          'Received broadcast response from another tab/session:',
          data
        );
      }

      // Set response for component to process.
      // Important: do this for both local responses and room broadcasts.
      setLastResponse({
        ...data,
        received_at: Date.now(),
        is_broadcast: !isOwnPendingRequest
      });

      setSocketError(null);
    });

    socket.on('error', (data) => {
      console.error('Socket.IO server error:', data);
      const errorMsg = data?.message || 'An error occurred on the server.';
      setSocketError(errorMsg);
      
      // NEW: Critical fix - clear loading state on error
      setLoadingResponse(false);
    });

    // ========== CHANNEL EVENTS ==========
    
    socket.on('channel_joined', (data) => {
      console.log('Successfully joined channel:', data);
    });

    socket.on('channel_left', (data) => {
      console.log('Left channel:', data);
    });

    socketRef.current = socket;
  }, []);

  /**
   * Disconnects socket
   */
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSocketId(null);
      setLoadingResponse(false); // NEW: Clear loading
    }
  }, []);

  /**
   * NEW: Setup request cleanup timeout protection
   * Removes stale requests after 30 seconds
   */
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const TIMEOUT = 30000; // 30 seconds
      
      let timedOutCount = 0;
      for (const [requestId, metadata] of pendingRequests.current) {
        if (now - metadata.timestamp > TIMEOUT) {
          console.warn(`Request timed out (>30s): ${requestId}`);
          pendingRequests.current.delete(requestId);
          timedOutCount++;
        }
      }
      
      // NEW: Reset loading if all pending requests timed out
      if (timedOutCount > 0 && pendingRequests.current.size === 0) {
        setLoadingResponse(false);
        setSocketError('Request timed out. Please try again.');
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  /**
   * Setup initial connection and token refresh handling
   */
  useEffect(() => {
    connectSocket();

    const handleTokenRefresh = () => {
      console.log('Reconnecting socket due to token refresh');
      // Force reconnect with new token
      disconnectSocket();
      setTimeout(connectSocket, 100);
    };

    // Listen for token changes in localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'access_token' && e.newValue) {
        handleTokenRefresh();
      }
    });

    return () => {
      disconnectSocket();
      window.removeEventListener('storage', handleTokenRefresh);
    };
  }, [connectSocket, disconnectSocket]);

  // ========== CLIENT -> SERVER ACTIONS ==========

  /**
   * Join a channel/room
   */
  const joinChannel = useCallback((channelId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_channel', { channel_id: channelId });
    }
  }, [isConnected]);

  /**
   * Leave a channel/room
   */
  const leaveChannel = useCallback((channelId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_channel', { channel_id: channelId });
    }
  }, [isConnected]);

  /**
   * NEW: Enhanced askQuestion with request tracking and message ID
   * 
   * @param {string} fileId - The file ID to ask about
   * @param {string} question - The question text
   * @param {string} messageId - Unique message ID for tracking
   * @returns {boolean} - true if emitted successfully, false otherwise
   */
  const askQuestion = useCallback((fileId, question, messageId) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Socket not connected. Cannot emit ask_question.');
      return false;
    }

    if (!fileId || !question || !messageId) {
      console.error('Missing required parameters for askQuestion', {
        fileId,
        question,
        messageId
      });
      return false;
    }

    try {
      // NEW: Start tracking this request
      const requestId = `${fileId}-${messageId}`;
      pendingRequests.current.set(requestId, {
        fileId,
        messageId,
        question,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 2
      });

      // Set loading state
      setLoadingResponse(true);
      setSocketError(null);

      console.log(`Emitting ask_question: ${requestId}`);
      
      // NEW: Include request_id for backend response matching
      socketRef.current.emit('ask_question', {
        file_id: fileId,
        question: question,
        request_id: messageId
      });

      return true;
    } catch (err) {
      console.error('Error emitting ask_question:', err);
      pendingRequests.current.delete(`${fileId}-${messageId}`);
      setLoadingResponse(false);
      return false;
    }
  }, [isConnected]);

  /**
   * NEW: Check if there's a pending request for given file and message
   */
  const hasPendingRequest = useCallback((fileId, messageId) => {
    return pendingRequests.current.has(`${fileId}-${messageId}`);
  }, []);

  /**
   * NEW: Get count of pending requests
   */
  const getPendingRequestCount = useCallback(() => {
    return pendingRequests.current.size;
  }, []);

  return {
    // Connection state
    isConnected,
    socketId,
    
    // Response state
    lastResponse,
    socketError,
    loadingResponse,
    
    // Actions
    askQuestion,
    joinChannel,
    leaveChannel,
    reconnect: connectSocket,
    
    // NEW: Utility methods
    hasPendingRequest,
    getPendingRequestCount
  };
};

export default useSocket;
