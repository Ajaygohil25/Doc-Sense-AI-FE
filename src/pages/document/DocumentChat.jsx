/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Loader';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  MessageSquare,
  Plus,
  Send,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

const getErrorMessage = (err, fallback) => (
  err.response?.data?.error || err.response?.data?.detail || fallback
);

const normalizeRooms = (data) => {
  if (Array.isArray(data)) return data;
  return data?.chat_rooms || [];
};

const normalizeMessages = (data) => {
  const messages = data?.messages || [];

  return messages.map((message, index) => ({
    id: message.id || `${message.sender}-${message.created_at}-${index}`,
    roomId: message.room_id || data.chat_room_id,
    sender: message.sender,
    text: message.message,
    timestamp: message.created_at
  }));
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatMessageTime = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isSuccessStatus = (status) => String(status || '').toLowerCase() === 'success';

const DocumentChat = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const chatEndRef = useRef(null);
  const activeRoomRef = useRef(null);

  const [fileDetails, setFileDetails] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [restLoading, setRestLoading] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  const {
    isConnected,
    lastResponse,
    lastStreamEvent,
    lastChatMessage,
    lastError,
    socketError,
    loadingResponse,
    askQuestion,
    getPendingRequestCount
  } = useSocket();

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(selectedRoomId)) || null,
    [rooms, selectedRoomId]
  );

  const documentCanAnswer = isSuccessStatus(fileDetails?.status);
  const isSending = Boolean(pendingRequestId) || restLoading || loadingResponse;
  const canSend = Boolean(selectedRoomId) && documentCanAnswer && !isSending && !messagesLoading;
  const pendingCount = getPendingRequestCount();

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    activeRoomRef.current = roomId;
    setMessagesLoading(true);

    try {
      const res = await api.get(`/chat/get-chat-messages-by-room-id/${roomId}`);
      if (activeRoomRef.current === roomId && res.data.success) {
        setMessages(normalizeMessages(res.data.data));
      }
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to load chat messages.'), 'error');
    } finally {
      if (activeRoomRef.current === roomId) {
        setMessagesLoading(false);
      }
    }
  }, [showToast]);

  const loadDocumentChat = useCallback(async () => {
    setPageLoading(true);

    try {
      const [fileRes, roomsRes] = await Promise.all([
        api.get(`/dashboard/get-file-by-id/${id}`),
        api.get(`/chat/get-chat-rooms-by-file-id/${id}`)
      ]);

      const fileData = fileRes.data.data;
      const roomList = normalizeRooms(roomsRes.data.data);
      const initialRoomId = roomList[0]?.id || null;

      setFileDetails(fileData);
      setRooms(roomList);
      setSelectedRoomId(initialRoomId);

      if (initialRoomId) {
        await loadMessages(initialRoomId);
      } else {
        activeRoomRef.current = null;
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to load document chat.'), 'error');
    } finally {
      setPageLoading(false);
    }
  }, [id, loadMessages, showToast]);

  useEffect(() => {
    loadDocumentChat();
  }, [loadDocumentChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, messagesLoading, restLoading, loadingResponse]);

  useEffect(() => {
    if (!socketError) return;
    showToast(socketError, 'error');
  }, [socketError, showToast]);

  const isCurrentSocketEvent = useCallback((event) => (
    event
    && String(event.file_id) === String(id)
    && String(event.chat_room_id) === String(selectedRoomId)
  ), [id, selectedRoomId]);

  const upsertAssistantMessage = useCallback((responseId, updates) => {
    setMessages((prev) => {
      let found = false;
      const nextMessages = prev.map((message) => {
        if (message.id !== responseId) return message;
        found = true;
        return { ...message, ...updates };
      });

      if (found) return nextMessages;

      return [
        ...nextMessages,
        {
          id: responseId,
          roomId: selectedRoomId,
          sender: updates.sender || 'assistant',
          text: updates.text || '',
          timestamp: updates.timestamp || new Date(),
          isStreaming: updates.isStreaming || false,
          requestId: updates.requestId
        }
      ];
    });
  }, [selectedRoomId]);

  const upsertChatMessage = useCallback((event) => {
    const incomingMessage = {
      id: event.id || `${event.sender}-${event.received_at}`,
      roomId: event.room_id || event.chat_room_id,
      sender: event.sender,
      text: event.message,
      timestamp: event.created_at || new Date(),
      requestId: event.request_id
    };

    setMessages((prev) => {
      let found = false;
      const nextMessages = prev.map((message) => {
        const sameId = incomingMessage.id && message.id === incomingMessage.id;
        const samePendingMessage = incomingMessage.requestId
          && message.requestId === incomingMessage.requestId
          && message.sender === incomingMessage.sender;

        if (!sameId && !samePendingMessage) return message;

        found = true;
        return {
          ...message,
          ...incomingMessage
        };
      });

      if (found) return nextMessages;

      return [...nextMessages, incomingMessage];
    });
  }, []);

  useEffect(() => {
    if (!isCurrentSocketEvent(lastChatMessage)) return;

    upsertChatMessage(lastChatMessage);
  }, [isCurrentSocketEvent, lastChatMessage, upsertChatMessage]);

  useEffect(() => {
    if (!isCurrentSocketEvent(lastStreamEvent) || !lastStreamEvent.request_id) return;

    const responseId = `response-${lastStreamEvent.request_id}`;

    if (lastStreamEvent.type === 'chunk') {
      setMessages((prev) => {
        let found = false;
        const nextMessages = prev.map((message) => {
          if (message.id !== responseId) return message;
          found = true;
          return {
            ...message,
            text: `${message.text || ''}${lastStreamEvent.chunk || ''}`,
            isStreaming: true
          };
        });

        if (found) return nextMessages;

        return [
          ...nextMessages,
          {
            id: responseId,
            roomId: selectedRoomId,
            sender: 'assistant',
            text: lastStreamEvent.chunk || '',
            timestamp: new Date(),
            isStreaming: true,
            requestId: lastStreamEvent.request_id
          }
        ];
      });
    }

    if (lastStreamEvent.type === 'end') {
      upsertAssistantMessage(responseId, {
        text: lastStreamEvent.response || '',
        isStreaming: false,
        requestId: lastStreamEvent.request_id,
        timestamp: new Date()
      });
    }
  }, [isCurrentSocketEvent, lastStreamEvent, selectedRoomId, upsertAssistantMessage]);

  useEffect(() => {
    if (!lastResponse || String(lastResponse.file_id) !== String(id)) return;

    if (lastResponse.request_id && lastResponse.request_id === pendingRequestId) {
      setPendingRequestId(null);
    }

    if (!isCurrentSocketEvent(lastResponse)) return;

    const responseId = lastResponse.request_id
      ? `response-${lastResponse.request_id}`
      : `response-${lastResponse.received_at}`;

    upsertAssistantMessage(responseId, {
      text: lastResponse.response,
      isStreaming: false,
      requestId: lastResponse.request_id,
      timestamp: new Date()
    });
  }, [id, isCurrentSocketEvent, lastResponse, pendingRequestId, upsertAssistantMessage]);

  useEffect(() => {
    if (!lastError) return;

    const sameFile = !lastError.file_id || String(lastError.file_id) === String(id);
    if (!sameFile) return;

    if (lastError.request_id && lastError.request_id === pendingRequestId) {
      setPendingRequestId(null);
    }

    const sameRoom = String(lastError.chat_room_id) === String(selectedRoomId);
    if (!sameRoom || !lastError.request_id) return;

    const responseId = `response-${lastError.request_id}`;
    upsertAssistantMessage(responseId, {
      sender: 'system-error',
      text: `Error: ${lastError.message}`,
      isStreaming: false,
      requestId: lastError.request_id,
      timestamp: new Date()
    });
  }, [id, lastError, pendingRequestId, selectedRoomId, upsertAssistantMessage]);

  const handleRoomSelect = async (room) => {
    if (!room || String(room.id) === String(selectedRoomId)) return;

    setSelectedRoomId(room.id);
    await loadMessages(room.id);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    const name = newRoomName.trim();
    if (!name) {
      showToast('Enter a chat room name.', 'error');
      return;
    }

    setCreatingRoom(true);

    try {
      const res = await api.post('/chat/create-chat-room', {
        file_id: id,
        name
      });

      const createdRoom = res.data.data?.chat_room;
      if (!createdRoom) {
        throw new Error('Invalid create chat room response.');
      }

      setRooms((prev) => [
        createdRoom,
        ...prev.filter((room) => String(room.id) !== String(createdRoom.id))
      ]);
      setSelectedRoomId(createdRoom.id);
      activeRoomRef.current = createdRoom.id;
      setMessages([]);
      setNewRoomName('');
      setCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      const fallback = err.message || 'Failed to create chat room.';
      showToast(getErrorMessage(err, fallback), 'error');
    } finally {
      setCreatingRoom(false);
    }
  };

  const completePendingWithError = (responseId, message) => {
    upsertAssistantMessage(responseId, {
      sender: 'system-error',
      text: `Error: ${message}`,
      isStreaming: false,
      timestamp: new Date()
    });
  };

  const handleRestFallback = async (question, messageId, responseId, roomId) => {
    setRestLoading(true);

    try {
      const res = await api.post('/chat/ask-question', {
        file_id: id,
        chat_room_id: roomId,
        question
      });

      if (activeRoomRef.current === roomId && res.data.success) {
        upsertAssistantMessage(responseId, {
          text: res.data.data.response,
          isStreaming: false,
          requestId: messageId,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error(err);
      const errMsg = getErrorMessage(err, 'Failed to generate response.');
      showToast(errMsg, 'error');

      if (activeRoomRef.current === roomId) {
        completePendingWithError(responseId, errMsg);
      }
    } finally {
      setPendingRequestId((current) => (current === messageId ? null : current));
      setRestLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!canSend || !inputText.trim()) return;

    const question = inputText.trim();
    const roomId = selectedRoomId;
    const messageId = `msg-${Date.now()}`;
    const responseId = `response-${messageId}`;

    setInputText('');
    setPendingRequestId(messageId);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${messageId}`,
        roomId,
        sender: 'user',
        text: question,
        timestamp: new Date(),
        requestId: messageId
      },
      {
        id: responseId,
        roomId,
        sender: 'assistant',
        text: '',
        timestamp: new Date(),
        isStreaming: true,
        requestId: messageId
      }
    ]);

    const emitted = isConnected && askQuestion(id, roomId, question, messageId);
    if (!emitted) {
      await handleRestFallback(question, messageId, responseId, roomId);
    }
  };

  const renderStatusNotice = () => {
    if (!fileDetails) return null;

    if (documentCanAnswer) return null;

    const status = String(fileDetails.status || 'Initiated');
    const isFailed = status.toLowerCase() === 'failed';

    return (
      <div className={`chat-notice ${isFailed ? 'notice-failed' : 'notice-processing'}`}>
        {isFailed ? <AlertTriangle size={16} /> : <Clock size={16} />}
        <span>
          {isFailed
            ? 'Question answering is disabled because this document failed processing.'
            : `Question answering is disabled until processing finishes. Current status: ${status}.`}
        </span>
      </div>
    );
  };

  const getInputPlaceholder = () => {
    if (!selectedRoomId) return 'Create or select a chat room first...';
    if (!documentCanAnswer) return 'Document processing must finish before questions can be sent...';
    if (isSending) return 'Waiting for the answer...';
    return 'Ask a question about this document...';
  };

  if (pageLoading) {
    return (
      <div className="chat-loading-screen">
        <Spinner size={40} />
        <p>Loading document chat...</p>
      </div>
    );
  }

  if (!fileDetails) {
    return (
      <div className="chat-error-screen">
        <AlertCircle size={48} className="error-icon" />
        <h2>Document Not Found</h2>
        <p>We could not retrieve this document or you do not have permission to view it.</p>
        <Link to="/documents" className="btn btn-primary">
          Return to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="document-chat-page">
      {renderStatusNotice()}

      <div className="chat-workspace">
        <aside className="rooms-panel">
          <div className="rooms-panel-header">
            <div className="rooms-heading">
              <Link to="/documents" className="icon-button" title="Back to documents" aria-label="Back to documents">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h3>Chat Rooms</h3>
                <span>{rooms.length} total</span>
              </div>
            </div>
            <button
              type="button"
              className="icon-button accent"
              onClick={() => setCreateModalOpen(true)}
              title="Create chat room"
              aria-label="Create chat room"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="document-context">
            <strong title={fileDetails.file_name}>{fileDetails.file_name}</strong>
            <div className="meta-row">
              <span className="status-chip">{fileDetails.status}</span>
            </div>
          </div>

          <div className="rooms-list">
            {rooms.length === 0 ? (
              <div className="rooms-empty">
                <MessageSquare size={24} />
                <p>No chat rooms yet.</p>
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  type="button"
                  key={room.id}
                  className={`room-item ${String(room.id) === String(selectedRoomId) ? 'active' : ''}`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <MessageSquare size={16} />
                  <span className="room-copy">
                    <strong title={room.name}>{room.name}</strong>
                    <small>{formatDateTime(room.created_at)}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="conversation-panel">
          <div className="conversation-header">
            <div>
              <h3>{selectedRoom?.name || 'No chat room selected'}</h3>
              <span>{selectedRoom ? 'Message history' : 'Create a room to begin'}</span>
            </div>
            {isConnected ? (
              <span className="connection-pill online" title={`Connected - ${pendingCount} pending`}>
                <Wifi size={12} />
                <span>Realtime</span>
              </span>
            ) : (
              <span className="connection-pill offline" title="REST fallback will be used">
                <WifiOff size={12} />
                <span>REST fallback</span>
              </span>
            )}
          </div>

          <div className="chat-messages-container">
            {messagesLoading ? (
              <div className="messages-loading">
                <Spinner size={28} />
                <span>Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="conversation-empty">
                <MessageSquare size={34} />
                <h3>{selectedRoom ? 'Start this chat' : 'No room selected'}</h3>
                <p>
                  {selectedRoom
                    ? 'Messages you send here will be saved to this chat room.'
                    : 'Choose a room from the list or create a new one.'}
                </p>
              </div>
            ) : (
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
                    <div className={`message-bubble ${msg.isStreaming ? 'streaming' : ''}`}>
                      {msg.text ? (
                        <p className="message-text">{msg.text}</p>
                      ) : (
                        <div className="typing-loader">
                          <span className="dot" />
                          <span className="dot" />
                          <span className="dot" />
                        </div>
                      )}
                      <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input-field"
              placeholder={getInputPlaceholder()}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!canSend}
            />
            <button
              type="submit"
              className="chat-send-btn btn btn-primary"
              disabled={!canSend || !inputText.trim()}
              title={isSending ? 'Waiting for response' : 'Send message'}
            >
              {isSending ? <Spinner size={16} color="#fff" /> : <Send size={16} />}
            </button>
          </form>
        </section>
      </div>

      {createModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="create-room-modal" onSubmit={handleCreateRoom}>
            <div className="modal-header">
              <h3>New Chat Room</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setCreateModalOpen(false)}
                title="Close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <label className="form-label" htmlFor="chat-room-name">Room name</label>
            <input
              id="chat-room-name"
              className="form-input"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              maxLength={120}
              autoFocus
              placeholder="Policy questions"
              disabled={creatingRoom}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateModalOpen(false)}
                disabled={creatingRoom}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creatingRoom || !newRoomName.trim()}
              >
                {creatingRoom ? <Spinner size={16} color="#fff" /> : <Plus size={16} />}
                <span>Create</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .document-chat-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          background-color: var(--bg-card);
          border: 0;
          border-radius: 0;
          overflow: hidden;
          box-shadow: none;
        }

        .chat-loading-screen,
        .chat-error-screen {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          padding: 2rem;
        }

        .chat-error-screen {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .error-icon {
          color: var(--danger-color);
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
        }

        .icon-button {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          background-color: var(--bg-card);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
          text-decoration: none;
        }

        .icon-button:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
          background-color: var(--bg-primary);
        }

        .icon-button.accent {
          color: var(--accent-color);
          border-color: var(--accent-color);
          background-color: var(--accent-light);
        }

        .chat-title-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .file-icon {
          color: var(--accent-color);
          flex-shrink: 0;
        }

        .title-details {
          min-width: 0;
          text-align: left;
        }

        .title-details h2 {
          font-size: 1.05rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .status-chip,
        .connection-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.175rem 0.5rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .status-chip {
          background-color: var(--bg-primary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .connection-pill.online {
          background-color: var(--success-light);
          color: var(--success-color);
        }

        .connection-pill.offline {
          background-color: var(--warning-light);
          color: var(--warning-color);
        }

        .chat-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          font-size: 0.84rem;
          font-weight: 600;
          border-bottom: 1px solid var(--border-color);
          text-align: left;
        }

        .notice-failed {
          background-color: var(--danger-light);
          color: var(--danger-color);
        }

        .notice-processing {
          background-color: var(--warning-light);
          color: var(--warning-color);
        }

        .chat-workspace {
          display: grid;
          grid-template-columns: 292px minmax(0, 1fr);
          min-height: 0;
          flex: 1;
        }

        .rooms-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-right: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
        }

        .rooms-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .rooms-heading {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .rooms-panel-header h3,
        .conversation-header h3 {
          font-size: 0.98rem;
          margin-bottom: 0.1rem;
        }

        .rooms-panel-header span,
        .conversation-header span {
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .document-context {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-card);
        }

        .document-context strong {
          display: block;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .rooms-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0.75rem;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }

        .room-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.72rem;
          border: 1px solid transparent;
          border-radius: 8px;
          background-color: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .room-item:hover {
          background-color: var(--bg-primary);
          border-color: var(--border-color);
        }

        .room-item.active {
          color: var(--accent-color);
          background-color: var(--accent-light);
          border-color: var(--accent-color);
        }

        .room-copy {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .room-copy strong {
          max-width: 190px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: inherit;
          font-size: 0.88rem;
        }

        .room-copy small {
          color: var(--text-muted);
          font-size: 0.72rem;
          margin-top: 0.15rem;
        }

        .rooms-empty,
        .conversation-empty,
        .messages-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          padding: 2rem 1rem;
        }

        .conversation-panel {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
        }

        .conversation-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-card);
          flex-shrink: 0;
        }

        .conversation-header h3 {
          max-width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .chat-messages-container {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 1.25rem;
          overscroll-behavior: contain;
        }

        .messages-scroller {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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
          max-width: min(76%, 720px);
          padding: 0.78rem 0.95rem;
          border-radius: 8px;
          box-shadow: var(--shadow-sm);
          text-align: left;
        }

        .row-assistant .message-bubble {
          background-color: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .row-user .message-bubble {
          background-color: var(--accent-color);
          color: white;
        }

        .row-system .message-bubble {
          max-width: min(82%, 640px);
          background-color: var(--danger-light);
          color: var(--danger-color);
          border: 1px dashed rgba(239, 68, 68, 0.35);
        }

        .message-bubble.streaming {
          border-color: var(--accent-color);
        }

        .message-text {
          font-size: 0.92rem;
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-time {
          display: block;
          margin-top: 0.35rem;
          font-size: 0.68rem;
          text-align: right;
          opacity: 0.68;
        }

        .typing-loader {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          min-width: 38px;
          height: 18px;
        }

        .typing-loader .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--text-muted);
          animation: bounce 1.4s infinite ease-in-out both;
          opacity: 0.65;
        }

        .typing-loader .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-loader .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .chat-input-form {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.95rem 1.25rem;
          border-top: 1px solid var(--border-color);
          background-color: var(--bg-card);
          flex-shrink: 0;
        }

        .chat-input-field {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-family: var(--font-sans);
          font-size: 0.92rem;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          outline: none;
          transition: all var(--transition-fast);
        }

        .chat-input-field:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .chat-input-field:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .chat-send-btn {
          width: 42px;
          height: 42px;
          padding: 0;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.48);
        }

        .create-room-modal {
          width: min(420px, 100%);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--bg-card);
          box-shadow: var(--shadow-lg);
          padding: 1.25rem;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .modal-header h3 {
          font-size: 1.08rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        @media (max-width: 900px) {
          .document-chat-page {
            height: 100%;
            min-height: 0;
          }

          .chat-workspace {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr);
          }

          .rooms-panel {
            max-height: 230px;
            min-height: 170px;
            border-right: none;
            border-bottom: 1px solid var(--border-color);
          }

          .rooms-list {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
          }

          .room-item {
            min-width: 220px;
          }

          .chat-messages-container {
            min-height: 0;
          }
        }

        @media (max-width: 640px) {
          .chat-header {
            align-items: flex-start;
            padding: 0.85rem;
          }

          .title-details h2 {
            font-size: 0.95rem;
          }

          .conversation-header,
          .chat-messages-container,
          .chat-input-form {
            padding-left: 0.85rem;
            padding-right: 0.85rem;
          }

          .message-bubble {
            max-width: 88%;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentChat;
