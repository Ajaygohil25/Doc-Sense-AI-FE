/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { Spinner } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../hooks/useSocket';
import {
  askProjectQuestion,
  createProjectChatRoom,
  getProject,
  getProjectChatMessages,
  listProjectChatRooms,
} from '../../services/projects';

const getErrorMessage = (err, fallback) => (
  err.response?.data?.error || err.response?.data?.detail || err.message || fallback
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
    timestamp: message.created_at,
  }));
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMessageTime = (value) => {
  if (!value) return '';

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isSuccessStatus = (status) => String(status || '').toLowerCase() === 'success';

const ProjectChat = () => {
  const { projectId } = useParams();
  const { showToast } = useToast();
  const chatEndRef = useRef(null);
  const activeRoomRef = useRef(null);

  const [project, setProject] = useState(null);
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
    askProjectQuestion: askProjectQuestionSocket,
    getPendingRequestCount,
  } = useSocket();

  const files = project?.files || [];
  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(selectedRoomId)) || null,
    [rooms, selectedRoomId]
  );
  const projectCanAnswer = files.some((file) => isSuccessStatus(file.status));
  const isSending = Boolean(pendingRequestId) || restLoading || loadingResponse;
  const canSend = Boolean(selectedRoomId) && projectCanAnswer && !isSending && !messagesLoading;
  const pendingCount = getPendingRequestCount();

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    activeRoomRef.current = roomId;
    setMessagesLoading(true);

    try {
      const res = await getProjectChatMessages(projectId, roomId);
      if (activeRoomRef.current === roomId && res.data.success) {
        setMessages(normalizeMessages(res.data.data));
      }
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to load project chat messages.'), 'error');
    } finally {
      if (activeRoomRef.current === roomId) {
        setMessagesLoading(false);
      }
    }
  }, [projectId, showToast]);

  const loadProjectChat = useCallback(async () => {
    setPageLoading(true);

    try {
      const [projectRes, roomsRes] = await Promise.all([
        getProject(projectId),
        listProjectChatRooms(projectId),
      ]);

      const projectData = projectRes.data.data?.project || null;
      const roomList = normalizeRooms(roomsRes.data.data);
      const effectiveRooms = roomList.length > 0 ? roomList : projectData?.chat_rooms || [];
      const initialRoomId = effectiveRooms[0]?.id || null;

      setProject(projectData);
      setRooms(effectiveRooms);
      setSelectedRoomId(initialRoomId);

      if (initialRoomId) {
        await loadMessages(initialRoomId);
      } else {
        activeRoomRef.current = null;
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to load project chat.'), 'error');
    } finally {
      setPageLoading(false);
    }
  }, [loadMessages, projectId, showToast]);

  useEffect(() => {
    loadProjectChat();
  }, [loadProjectChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, messagesLoading, restLoading, loadingResponse]);

  useEffect(() => {
    if (!socketError) return;
    showToast(socketError, 'error');
  }, [socketError, showToast]);

  const isCurrentSocketEvent = useCallback((event) => (
    event
    && String(event.project_id) === String(projectId)
    && String(event.chat_room_id) === String(selectedRoomId)
  ), [projectId, selectedRoomId]);

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
          requestId: updates.requestId,
        },
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
      requestId: event.request_id,
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
          ...incomingMessage,
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
            isStreaming: true,
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
            requestId: lastStreamEvent.request_id,
          },
        ];
      });
    }

    if (lastStreamEvent.type === 'end') {
      upsertAssistantMessage(responseId, {
        text: lastStreamEvent.response || '',
        isStreaming: false,
        requestId: lastStreamEvent.request_id,
        timestamp: new Date(),
      });
    }
  }, [isCurrentSocketEvent, lastStreamEvent, selectedRoomId, upsertAssistantMessage]);

  useEffect(() => {
    if (!lastResponse || String(lastResponse.project_id) !== String(projectId)) return;

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
      timestamp: new Date(),
    });
  }, [isCurrentSocketEvent, lastResponse, pendingRequestId, projectId, upsertAssistantMessage]);

  useEffect(() => {
    if (!lastError) return;

    const sameProject = !lastError.project_id || String(lastError.project_id) === String(projectId);
    if (!sameProject) return;

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
      timestamp: new Date(),
    });
  }, [lastError, pendingRequestId, projectId, selectedRoomId, upsertAssistantMessage]);

  const handleRoomSelect = async (room) => {
    if (!room || String(room.id) === String(selectedRoomId)) return;

    setSelectedRoomId(room.id);
    await loadMessages(room.id);
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();

    const name = newRoomName.trim();
    if (!name) {
      showToast('Enter a chat room name.', 'error');
      return;
    }

    setCreatingRoom(true);

    try {
      const res = await createProjectChatRoom(projectId, { name });
      const createdRoom = res.data.data?.chat_room;

      if (!createdRoom) {
        throw new Error('Invalid create chat room response.');
      }

      setRooms((prev) => [
        createdRoom,
        ...prev.filter((room) => String(room.id) !== String(createdRoom.id)),
      ]);
      setSelectedRoomId(createdRoom.id);
      activeRoomRef.current = createdRoom.id;
      setMessages([]);
      setNewRoomName('');
      setCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to create chat room.'), 'error');
    } finally {
      setCreatingRoom(false);
    }
  };

  const completePendingWithError = (responseId, message) => {
    upsertAssistantMessage(responseId, {
      sender: 'system-error',
      text: `Error: ${message}`,
      isStreaming: false,
      timestamp: new Date(),
    });
  };

  const handleRestFallback = async (question, messageId, responseId, roomId) => {
    setRestLoading(true);

    try {
      const res = await askProjectQuestion(projectId, {
        chat_room_id: roomId,
        question,
      });

      if (activeRoomRef.current === roomId && res.data.success) {
        upsertAssistantMessage(responseId, {
          text: res.data.data.response,
          isStreaming: false,
          requestId: messageId,
          timestamp: new Date(),
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

  const handleSendMessage = async (event) => {
    event.preventDefault();

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
        requestId: messageId,
      },
      {
        id: responseId,
        roomId,
        sender: 'assistant',
        text: '',
        timestamp: new Date(),
        isStreaming: true,
        requestId: messageId,
      },
    ]);

    const emitted = isConnected && askProjectQuestionSocket(projectId, roomId, question, messageId);
    if (!emitted) {
      await handleRestFallback(question, messageId, responseId, roomId);
    }
  };

  const renderStatusNotice = () => {
    if (!project) return null;
    if (projectCanAnswer) return null;

    const hasFailed = files.some((file) => String(file.status || '').toLowerCase() === 'failed');

    return (
      <div className={`chat-notice ${hasFailed ? 'notice-failed' : 'notice-processing'}`}>
        {hasFailed ? <AlertTriangle size={16} /> : <Clock size={16} />}
        <span>
          {hasFailed
            ? 'Question answering is disabled until at least one project file finishes successfully.'
            : 'Question answering is disabled until one project file finishes processing successfully.'}
        </span>
      </div>
    );
  };

  const getInputPlaceholder = () => {
    if (!selectedRoomId) return 'Create or select a chat room first...';
    if (!projectCanAnswer) return 'A project file must finish processing before questions can be sent...';
    if (isSending) return 'Waiting for the answer...';
    return 'Ask a question about this project...';
  };

  if (pageLoading) {
    return (
      <div className="chat-loading-screen">
        <Spinner size={40} />
        <p>Loading project chat...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="chat-error-screen">
        <AlertCircle size={48} className="error-icon" />
        <h2>Project Not Found</h2>
        <p>We could not retrieve this project or you do not have permission to view it.</p>
        <Link to="/projects" className="btn btn-primary">
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="project-chat-page">
      {renderStatusNotice()}

      <div className="chat-workspace">
        <aside className="rooms-panel">
          <div className="rooms-panel-header">
            <div className="rooms-heading">
              <Link to={`/projects/${projectId}`} className="icon-button" title="Back to project" aria-label="Back to project">
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

          <div className="project-context">
            <strong title={project.name}>{project.name}</strong>
            <div className="meta-row">
              <FileText size={14} />
              <span>{files.length} file{files.length === 1 ? '' : 's'}</span>
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
              <span>{selectedRoom ? 'Project message history' : 'Create a room to begin'}</span>
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
                <h3>{selectedRoom ? 'Start this project chat' : 'No room selected'}</h3>
                <p>
                  {selectedRoom
                    ? 'Messages you send here are saved to this project chat room.'
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
              onChange={(event) => setInputText(event.target.value)}
              disabled={!canSend}
            />
            <button
              type="submit"
              className="chat-send-btn btn btn-primary"
              disabled={!canSend || !inputText.trim()}
              title={isSending ? 'Waiting for response' : 'Send message'}
            >
              {isSending ? <Spinner size={16} color="var(--on-accent)" /> : <Send size={16} />}
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
            <label className="form-label" htmlFor="project-chat-room-name">Room name</label>
            <input
              id="project-chat-room-name"
              className="form-input"
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
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
                {creatingRoom ? <Spinner size={16} color="var(--on-accent)" /> : <Plus size={16} />}
                <span>Create</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .project-chat-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          background-color: var(--bg-primary);
          overflow: hidden;
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

        .error-icon {
          color: var(--danger-color);
        }

        .chat-workspace {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          height: 100%;
          min-height: 0;
        }

        .rooms-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-right: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .rooms-panel-header,
        .rooms-heading,
        .conversation-header,
        .connection-pill,
        .chat-input-form,
        .modal-header,
        .modal-actions,
        .meta-row {
          display: flex;
          align-items: center;
        }

        .rooms-panel-header,
        .conversation-header,
        .modal-header {
          justify-content: space-between;
        }

        .rooms-panel-header {
          min-height: 70px;
          padding: 0.85rem;
          border-bottom: 1px solid var(--border-color);
        }

        .rooms-heading {
          gap: 0.75rem;
        }

        .rooms-heading h3,
        .conversation-header h3 {
          font-size: 1rem;
        }

        .rooms-heading span,
        .conversation-header span,
        .meta-row {
          color: var(--text-secondary);
          font-size: 0.82rem;
        }

        .icon-button {
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          color: var(--text-secondary);
          background-color: var(--bg-elevated);
          cursor: pointer;
          text-decoration: none;
          flex-shrink: 0;
        }

        .icon-button.accent {
          color: var(--on-accent);
          background: var(--accent-color);
          border-color: var(--accent-color);
        }

        .project-context {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          background: var(--sidebar-user-bg);
        }

        .project-context strong {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-row {
          gap: 0.35rem;
        }

        .rooms-list {
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          gap: 0.5rem;
        }

        .room-item {
          width: 100%;
          display: flex;
          gap: 0.65rem;
          align-items: flex-start;
          text-align: left;
          min-height: 52px;
          padding: 0.75rem;
          border: 1px solid transparent;
          border-radius: var(--border-radius-md);
          color: var(--text-primary);
          background-color: transparent;
          cursor: pointer;
        }

        .room-item.active,
        .room-item:hover {
          border-color: var(--border-color);
          background-color: var(--sidebar-hover-bg);
        }

        .room-item.active {
          color: var(--accent-color);
          background: var(--accent-light);
          border-color: var(--border-strong);
        }

        .room-item.active .room-copy small { color: var(--text-secondary); }

        .room-copy {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .room-copy strong {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .room-copy small {
          color: var(--text-secondary);
        }

        .rooms-empty,
        .messages-loading,
        .conversation-empty {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          text-align: center;
          color: var(--text-secondary);
          padding: 1rem;
        }

        .conversation-panel {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          background: var(--bg-primary);
        }

        .conversation-header {
          min-height: 70px;
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          gap: 1rem;
          background: var(--bg-card);
        }

        .connection-pill {
          gap: 0.35rem;
          padding: 0.3rem 0.6rem;
          border-radius: var(--border-radius-pill);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .connection-pill.online {
          color: var(--success-color);
          background-color: var(--success-light);
        }

        .connection-pill.offline {
          color: var(--warning-color);
          background-color: var(--warning-light);
        }

        .chat-messages-container {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: transparent;
        }

        .messages-scroller {
          height: 100%;
          overflow-y: auto;
          padding: clamp(1rem, 3vw, 1.75rem);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .message-row {
          display: flex;
        }

        .row-user {
          justify-content: flex-end;
        }

        .row-assistant,
        .row-system {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: min(720px, 78%);
          padding: 0.75rem 0.9rem;
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          box-shadow: var(--shadow-sm);
        }

        .row-user .message-bubble {
          color: var(--on-accent);
          background: var(--accent-color);
          border-color: var(--accent-color);
        }

        .row-system .message-bubble {
          color: var(--danger-color);
          background-color: var(--danger-light);
        }

        .message-text {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .message-time {
          display: block;
          margin-top: 0.4rem;
          font-size: 0.7rem;
          opacity: 0.7;
          text-align: right;
        }

        .typing-loader {
          display: flex;
          gap: 0.25rem;
          align-items: center;
          min-width: 42px;
          min-height: 20px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--text-muted);
          animation: pulse 1s infinite ease-in-out;
        }

        .dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }

        .chat-input-form {
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
          background: var(--bg-card);
        }

        .chat-input-field {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--border-color);
          min-height: 48px;
          border-radius: var(--border-radius-md);
          background-color: var(--bg-elevated);
          color: var(--text-primary);
          padding: 0.75rem 0.9rem;
          font: inherit;
        }

        .chat-input-field:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-light);
        }

        .chat-send-btn {
          width: 48px;
          height: 48px;
          padding: 0;
          border-radius: var(--border-radius-pill);
        }

        .chat-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }

        .notice-processing {
          color: var(--warning-color);
          background-color: var(--warning-light);
        }

        .notice-failed {
          color: var(--danger-color);
          background-color: var(--danger-light);
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(7, 9, 42, 0.68);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
        }

        .create-room-modal {
          width: min(440px, 100%);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding: 1.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-xl);
          background: var(--bg-card);
          box-shadow: var(--shadow-lg);
        }

        .modal-actions {
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .modal-header h3 { font-size: 1.25rem; }

        @media (max-width: 767px) {
          .chat-workspace {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr);
          }

          .rooms-panel {
            min-height: 150px;
            max-height: 210px;
            border-right: 0;
            border-bottom: 1px solid var(--border-color);
          }

          .rooms-list {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
          }

          .room-item {
            min-width: 210px;
          }

          .message-bubble {
            max-width: 92%;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectChat;
