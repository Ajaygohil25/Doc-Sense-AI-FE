import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../context/ToastContext';
import { SkeletonChat, Spinner } from '../../components/ui/Loader';
import { 
  Send, 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  AlertCircle,
  HelpCircle,
  Wifi,
  WifiOff,
  Settings,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const DocumentChat = () => {
  const { id } = useParams();
  const [fileDetails, setFileDetails] = useState(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [restLoading, setRestLoading] = useState(false);
  
  const chatEndRef = useRef(null);
  const { showToast } = useToast();
  
  // Connect to socket.io
  const { 
    isConnected, 
    lastResponse, 
    socketError, 
    loadingResponse, 
    askQuestion,
    getPendingRequestCount
  } = useSocket();

  // Fetch file details on mount
  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        // GET /api/v1/dashboard/get-file-by-id/{upload_file_id}
        const res = await api.get(`/dashboard/get-file-by-id/${id}`);
        if (res.data.success) {
          setFileDetails(res.data.data);
          
          // Initial greeting message
          setMessages([
            {
              id: 'welcome',
              sender: 'assistant',
              text: `Hello! I have loaded your document "${res.data.data.file_name}". What would you like to know about it?`,
              timestamp: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load document details.';
        showToast(errMsg, 'error');
      } finally {
        setFileLoading(false);
      }
    };

    fetchFileDetails();
  }, [id, showToast]);

  // Handle Socket.IO responses (ENHANCED)
  useEffect(() => {
    if (lastResponse && lastResponse.file_id === id) {
      // NEW: Validate response format
      if (!lastResponse.response) {
        console.error('Invalid response format:', lastResponse);
        showToast('Received invalid response format', 'error');
        return;
      }

      // NEW: Add response to chat with proper ID linking
      const responseId = lastResponse.request_id 
        ? `response-${lastResponse.request_id}` 
        : `response-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: responseId,
          sender: 'assistant',
          text: lastResponse.response,
          timestamp: new Date()
        }
      ]);
    }
  }, [lastResponse, id, showToast]);

  // Handle Socket.IO errors
  useEffect(() => {
    if (socketError) {
      showToast(socketError, 'error');
    }
  }, [socketError, showToast]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingResponse, restLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const question = inputText.trim();
    setInputText('');

    // NEW: Generate unique message ID for tracking
    const userMessageId = `user-${Date.now()}`;
    
    // NEW: Add user message with ID
    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text: question,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);

    if (isConnected) {
      // NEW: Pass message ID to socket for request matching
      const success = askQuestion(id, question, userMessageId);
      
      if (!success) {
        console.warn('Socket emission failed. Falling back to REST API.');
        handleRestFallback(question);
      }
    } else {
      console.warn('Socket not connected. Falling back to REST API.');
      handleRestFallback(question);
    }
  };

  // REST API Q&A Fallback
  const handleRestFallback = async (question) => {
    setRestLoading(true);
    try {
      // POST /api/v1/rag/question
      const res = await api.post('/rag/question', {
        file_id: id,
        question: question
      });

      if (res.data.success && res.data.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: `response-${Date.now()}`,
            sender: 'assistant',
            text: res.data.data.response,
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to generate response.';
      showToast(errMsg, 'error');
      
      // Append system error message to thread
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'system-error',
          text: `Error: ${errMsg}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setRestLoading(false);
    }
  };

  const getStatusNotice = () => {
    if (!fileDetails) return null;
    const status = fileDetails.status ? fileDetails.status.toLowerCase() : 'pending';
    
    if (status === 'failed') {
      return (
        <div className="chat-notice notice-failed">
          <AlertTriangle size={16} />
          <span>This file failed to process. AI answers may be unavailable or incomplete.</span>
        </div>
      );
    }
    
    if (status === 'pending' || status === 'processing') {
      return (
        <div className="chat-notice notice-processing">
          <Spinner size={14} color="var(--accent-color)" />
          <span>Document is still processing. You can chat, but full vector indexing may still be running.</span>
        </div>
      );
    }
    return null;
  };

  if (fileLoading) {
    return (
      <div className="chat-loading-screen">
        <Spinner size={40} />
        <p>Loading document session...</p>
      </div>
    );
  }

  if (!fileDetails) {
    return (
      <div className="chat-error-screen card">
        <AlertCircle size={48} className="error-icon" />
        <h2>Document Not Found</h2>
        <p>We couldn't retrieve details for this document or you do not have permission to view it.</p>
        <Link to="/documents" className="btn btn-primary">
          Return to Documents
        </Link>
      </div>
    );
  }

  const isLoading = loadingResponse || restLoading;
  const pendingCount = getPendingRequestCount();

  return (
    <div className="document-chat-page">
      <div className="chat-header">
        <Link to="/documents" className="chat-back-btn">
          <ArrowLeft size={18} />
        </Link>
        <div className="chat-title-info">
          <FileText size={20} className="file-icon" />
          <div className="title-details">
            <h2 title={fileDetails.file_name}>{fileDetails.file_name}</h2>
            <div className="connection-pill-row">
              {isConnected ? (
                <span className="connection-pill online" title={`Connected • ${pendingCount} pending`}>
                  <Wifi size={10} />
                  <span>Real-time connected</span>
                </span>
              ) : (
                <span className="connection-pill offline" title="Using REST API fallback">
                  <WifiOff size={10} />
                  <span>REST Fallback Mode</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {getStatusNotice()}

      <div className="chat-messages-container">
        <div className="messages-scroller">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message-row ${
                msg.sender === 'user' 
                  ? 'row-user' 
                  : msg.sender === 'system-error'
                  ? 'row-system'
                  : 'row-assistant'
              }`}
            >
              <div className="message-bubble">
                <p className="message-text">{msg.text}</p>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-row row-assistant">
              <div className="message-bubble loading-bubble">
                <div className="typing-loader">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input-field"
          placeholder="Ask a question about this document..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="chat-send-btn btn btn-primary" 
          disabled={!inputText.trim() || isLoading}
          title={isLoading ? 'Waiting for response...' : 'Send message'}
        >
          {isLoading ? <Spinner size={16} color="#fff" /> : <Send size={16} />}
        </button>
      </form>

      <style>{`
        .document-chat-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 4rem); /* accounting for main layout margins */
          position: relative;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .chat-loading-screen, .chat-error-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          height: 350px;
          text-align: center;
          padding: 2rem;
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
        }

        .chat-back-btn {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }

        .chat-back-btn:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .chat-title-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .chat-title-info .file-icon {
          color: var(--accent-color);
          flex-shrink: 0;
        }

        .title-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
          text-align: left;
        }

        .title-details h2 {
          font-size: 1.05rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .connection-pill-row {
          display: flex;
          align-items: center;
          margin-top: 0.125rem;
        }

        .connection-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.675rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        .connection-pill.online {
          background-color: var(--success-light);
          color: var(--success-color);
        }

        .connection-pill.offline {
          background-color: var(--warning-light);
          color: var(--warning-color);
        }

        /* Notices */
        .chat-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.5rem;
          font-size: 0.8rem;
          font-weight: 500;
          border-bottom: 1px solid var(--border-color);
          text-align: left;
        }

        .notice-failed {
          background-color: var(--danger-light);
          color: var(--danger-color);
        }

        .notice-processing {
          background-color: var(--bg-primary);
          color: var(--text-secondary);
        }

        /* Messages Scroller */
        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          background-color: var(--bg-primary);
        }

        .messages-scroller {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-height: 100%;
        }

        .message-row {
          display: flex;
          width: 100%;
        }

        .row-assistant {
          justify-content: flex-start;
        }

        .row-user {
          justify-content: flex-end;
        }

        .row-system {
          justify-content: center;
        }

        .message-bubble {
          max-width: 75%;
          padding: 0.875rem 1.125rem;
          border-radius: 14px;
          position: relative;
          box-shadow: var(--shadow-sm);
          text-align: left;
        }

        .row-assistant .message-bubble {
          background-color: var(--bg-card);
          color: var(--text-primary);
          border-bottom-left-radius: 2px;
          border: 1px solid var(--border-color);
        }

        .row-user .message-bubble {
          background-color: var(--accent-color);
          color: white;
          border-bottom-right-radius: 2px;
        }

        .row-system .message-bubble {
          background-color: var(--danger-light);
          color: var(--danger-color);
          border: 1px dashed rgba(239, 68, 68, 0.25);
          font-size: 0.8rem;
          padding: 0.5rem 1rem;
          border-radius: var(--border-radius-md);
        }

        .message-text {
          font-size: 0.925rem;
          line-height: 1.5;
          white-space: pre-line;
          word-break: break-word;
        }

        .message-time {
          display: block;
          font-size: 0.675rem;
          margin-top: 0.375rem;
          text-align: right;
          opacity: 0.6;
        }

        .row-user .message-time {
          color: rgba(255, 255, 255, 0.8);
        }

        .row-assistant .message-time {
          color: var(--text-muted);
        }

        /* Typing Loader */
        .loading-bubble {
          padding: 0.75rem 1.25rem;
        }

        .typing-loader {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          height: 18px;
        }

        .typing-loader .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--text-muted);
          animation: bounce 1.4s infinite ease-in-out both;
          opacity: 0.6;
        }

        .typing-loader .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-loader .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Input Form */
        .chat-input-form {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background-color: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
        }

        .chat-input-field {
          flex: 1;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 0.75rem 1.25rem;
          font-family: var(--font-sans);
          font-size: 0.925rem;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          outline: none;
          transition: all var(--transition-fast);
        }

        .chat-input-field:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background-color: var(--bg-secondary);
        }

        .chat-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .document-chat-page {
            height: calc(100vh - 2rem);
          }
          .message-bubble {
            max-width: 85%;
          }
          .chat-input-form {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentChat;
