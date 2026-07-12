import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentChat from '../pages/document/DocumentChat';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';

const showToast = vi.hoisted(() => vi.fn());

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showToast,
  }),
}));

const fileDetails = {
  id: 'file-1',
  file_name: 'Policy.pdf',
  status: 'Success',
  created_at: '2026-06-26 10:00:00',
};

const rooms = [
  {
    id: 'room-latest',
    file_id: 'file-1',
    name: 'Latest room',
    created_at: '2026-06-26T12:00:00',
  },
  {
    id: 'room-old',
    file_id: 'file-1',
    name: 'Older room',
    created_at: '2026-06-25T12:00:00',
  },
];

const historyPayload = {
  chat_room_id: 'room-latest',
  messages: [
    {
      id: 'message-1',
      room_id: 'room-latest',
      sender: 'user',
      message: 'What is the policy?',
      created_at: '2026-06-26T12:01:00',
    },
    {
      id: 'message-2',
      room_id: 'room-latest',
      sender: 'assistant',
      message: 'Stored answer',
      created_at: '2026-06-26T12:02:00',
    },
  ],
};

const renderDocumentChat = () => render(
  <MemoryRouter initialEntries={['/documents/file-1/chat']}>
    <Routes>
      <Route path="/documents/:id/chat" element={<DocumentChat />} />
    </Routes>
  </MemoryRouter>
);

const renderStrictDocumentChat = () => render(
  <StrictMode>
    <MemoryRouter initialEntries={['/documents/file-1/chat']}>
      <Routes>
        <Route path="/documents/:id/chat" element={<DocumentChat />} />
      </Routes>
    </MemoryRouter>
  </StrictMode>
);

const mockDocumentWithRooms = (document, chatRooms) => {
  api.get.mockImplementation((url) => {
    if (url === '/dashboard/get-file-by-id/file-1') {
      return Promise.resolve({ data: { success: true, data: document } });
    }

    if (url === '/chat/get-chat-rooms-by-file-id/file-1') {
      return Promise.resolve({ data: { success: true, data: { chat_rooms: chatRooms } } });
    }

    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
};

const mockInitialApi = () => {
  api.get.mockImplementation((url) => {
    if (url === '/dashboard/get-file-by-id/file-1') {
      return Promise.resolve({ data: { success: true, data: fileDetails } });
    }

    if (url === '/chat/get-chat-rooms-by-file-id/file-1') {
      return Promise.resolve({ data: { success: true, data: { chat_rooms: rooms } } });
    }

    if (url === '/chat/get-chat-messages-by-room-id/room-latest') {
      return Promise.resolve({ data: { success: true, data: historyPayload } });
    }

    if (url === '/chat/get-chat-messages-by-room-id/room-old') {
      return Promise.resolve({
        data: {
          success: true,
          data: { chat_room_id: 'room-old', messages: [] },
        },
      });
    }

    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
};

describe('DocumentChat', () => {
  let askQuestion;

  beforeEach(() => {
    vi.clearAllMocks();
    showToast.mockClear();
    askQuestion = vi.fn(() => true);
    useSocket.mockReturnValue({
      isConnected: true,
      lastResponse: null,
      lastStreamEvent: null,
      lastError: null,
      socketError: null,
      loadingResponse: false,
      askQuestion,
      getPendingRequestCount: () => 0,
    });
    mockInitialApi();
  });

  it('loads rooms, auto-selects the latest room, and renders history', async () => {
    const { container } = renderDocumentChat();

    expect((await screen.findAllByText('Latest room')).length).toBeGreaterThan(0);
    expect(screen.getByText('Stored answer')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/chat/get-chat-messages-by-room-id/room-latest');
    expect(container.querySelector('.chat-workspace')).not.toHaveClass('discord-chat-workspace');
    expect(container.querySelector('.rooms-panel')).toBeInTheDocument();
    expect(container.querySelector('.conversation-panel')).toBeInTheDocument();
  });

  it('defines an inset responsive workspace for the document chat page', async () => {
    const { container } = renderDocumentChat();

    await screen.findByText('Stored answer');
    const styles = container.querySelector('style').textContent;

    expect(styles).toMatch(/\.document-chat-page\s*\{[^}]*box-sizing: border-box;/s);
    expect(styles).toMatch(/\.document-chat-page\s*\{[^}]*padding: 1\.5rem;/s);
    expect(styles).toMatch(/\.chat-workspace\s*\{[^}]*gap: 1rem;/s);
    expect(styles).toMatch(/\.rooms-panel\s*\{[^}]*border: 1px solid var\(--border-color\);/s);
    expect(styles).toMatch(/\.conversation-panel\s*\{[^}]*border: 1px solid var\(--border-color\);/s);
    expect(styles).toMatch(/\.row-user \.message-text\s*\{[^}]*color: var\(--on-accent\);/s);
    expect(styles).toMatch(/\.row-assistant \.message-text\s*\{[^}]*color: var\(--text-primary\);/s);
    expect(styles).toMatch(/\.message-text\s*\{[^}]*font-size: 1rem;[^}]*overflow-wrap: anywhere;/s);
    expect(styles).toMatch(/\.messages-scroller\s*\{[^}]*width: 100%;[^}]*max-width: 960px;[^}]*margin: 0 auto;/s);
    expect(styles).toMatch(/\.composer-inner\s*\{[^}]*width: 100%;[^}]*max-width: 960px;[^}]*margin: 0 auto;/s);
    expect(styles).toMatch(/\.conversation-heading\s*\{[^}]*flex: 1;[^}]*min-width: 0;/s);
    expect(styles).toMatch(/@media \(max-width: 1023px\)[\s\S]*?\.document-chat-page\s*\{[^}]*padding: 1rem;/);
    expect(styles).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.document-chat-page\s*\{[^}]*padding: 0\.75rem;/);
    expect(styles).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.rooms-panel\s*\{[^}]*position: fixed;[^}]*transform: translateX\(-110%\);/);
    expect(styles).toMatch(/@media \(max-width: 480px\)[\s\S]*?\.connection-pill span,[\s\S]*?\.rooms-drawer-toggle span\s*\{[^}]*display: none;/);
    expect(container.querySelector('.composer-inner')).toBeInTheDocument();
  });

  it('opens and closes the mobile rooms drawer with its controls', async () => {
    renderDocumentChat();

    await screen.findByText('Stored answer');
    const panel = screen.getByRole('complementary', { name: 'Chat rooms' });
    const openButton = screen.getByLabelText('Open chat rooms');

    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(openButton);
    expect(panel).toHaveClass('mobile-open');
    expect(openButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByLabelText('Close chat rooms'));
    expect(panel).not.toHaveClass('mobile-open');
  });

  it('closes the mobile rooms drawer from the backdrop and Escape key', async () => {
    renderDocumentChat();

    await screen.findByText('Stored answer');
    const panel = screen.getByRole('complementary', { name: 'Chat rooms' });
    const openButton = screen.getByLabelText('Open chat rooms');

    fireEvent.click(openButton);
    fireEvent.click(screen.getByLabelText('Dismiss chat rooms'));
    expect(panel).not.toHaveClass('mobile-open');

    fireEvent.click(openButton);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panel).not.toHaveClass('mobile-open');
  });

  it('closes the mobile rooms drawer after selecting a room', async () => {
    renderDocumentChat();

    await screen.findByText('Stored answer');
    const panel = screen.getByRole('complementary', { name: 'Chat rooms' });
    fireEvent.click(screen.getByLabelText('Open chat rooms'));
    fireEvent.click(screen.getByRole('button', { name: /Older room/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/chat/get-chat-messages-by-room-id/room-old');
    });
    expect(panel).not.toHaveClass('mobile-open');
  });

  it('creates a named chat room and selects it', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          chat_room: {
            id: 'room-new',
            file_id: 'file-1',
            name: 'Benefit questions',
            created_at: '2026-06-26T13:00:00',
          },
        },
      },
    });

    renderDocumentChat();

    fireEvent.click(await screen.findByLabelText('Create chat room'));
    fireEvent.change(screen.getByLabelText('Room name'), {
      target: { value: 'Benefit questions' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/chat/create-chat-room', {
        file_id: 'file-1',
        name: 'Benefit questions',
      });
    });
  });

  it('creates and selects a default room when a successful document has no rooms', async () => {
    mockDocumentWithRooms(fileDetails, []);
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          chat_room: {
            id: 'room-default',
            file_id: 'file-1',
            name: 'Default chat',
            created_at: '2026-06-26T13:00:00',
          },
        },
      },
    });

    renderDocumentChat();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/chat/create-chat-room', {
        file_id: 'file-1',
        name: 'Default chat',
      });
    });

    expect((await screen.findAllByText('Default chat')).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeEnabled();
  });

  it('creates the default room only once when effects are repeated', async () => {
    mockDocumentWithRooms(fileDetails, []);
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          chat_room: {
            id: 'room-default',
            file_id: 'file-1',
            name: 'Default chat',
            created_at: '2026-06-26T13:00:00',
          },
        },
      },
    });

    renderStrictDocumentChat();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask a question/i)).toBeEnabled();
    });
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('shows a preparation state while the default room is being created', async () => {
    mockDocumentWithRooms(fileDetails, []);
    api.post.mockReturnValue(new Promise(() => {}));

    renderDocumentChat();

    expect(await screen.findByText('Preparing your chat...')).toBeInTheDocument();
  });

  it('offers a retry when automatic room creation fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockDocumentWithRooms(fileDetails, []);
    api.post.mockRejectedValueOnce(new Error('Room service unavailable'));

    renderDocumentChat();

    const retryButton = await screen.findByRole('button', { name: /try again/i });
    expect(screen.getByText(/could not prepare a chat room/i)).toBeInTheDocument();

    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          chat_room: {
            id: 'room-retried',
            file_id: 'file-1',
            name: 'Default chat',
            created_at: '2026-06-26T13:05:00',
          },
        },
      },
    });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2);
      expect(screen.getByPlaceholderText(/ask a question/i)).toBeEnabled();
    });

    consoleError.mockRestore();
  });

  it.each([
    ['Processing', /question answering is disabled until processing finishes/i],
    ['Failed', /question answering is disabled because this document failed processing/i],
  ])('does not create a room when a document status is %s', async (status, notice) => {
    mockDocumentWithRooms({ ...fileDetails, status }, []);

    renderDocumentChat();

    expect(await screen.findByText(notice)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('sends socket questions with the selected chat room id', async () => {
    renderDocumentChat();

    fireEvent.change(await screen.findByPlaceholderText(/ask a question/i), {
      target: { value: 'Explain the leave policy' },
    });
    fireEvent.click(screen.getByTitle('Send message'));

    await waitFor(() => {
      expect(askQuestion).toHaveBeenCalledWith(
        'file-1',
        'room-latest',
        'Explain the leave policy',
        expect.any(String),
      );
    });
  });

  it('uses REST fallback when the socket is unavailable', async () => {
    useSocket.mockReturnValue({
      isConnected: false,
      lastResponse: null,
      lastStreamEvent: null,
      lastError: null,
      socketError: null,
      loadingResponse: false,
      askQuestion,
      getPendingRequestCount: () => 0,
    });
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          file_id: 'file-1',
          chat_room_id: 'room-latest',
          question: 'Explain the leave policy',
          response: 'REST answer',
        },
      },
    });

    renderDocumentChat();

    fireEvent.change(await screen.findByPlaceholderText(/ask a question/i), {
      target: { value: 'Explain the leave policy' },
    });
    fireEvent.click(screen.getByTitle('Send message'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/chat/ask-question', {
        file_id: 'file-1',
        chat_room_id: 'room-latest',
        question: 'Explain the leave policy',
      });
    });
    expect(askQuestion).not.toHaveBeenCalled();
  });
});
