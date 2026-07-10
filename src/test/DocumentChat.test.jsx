import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    expect(container.querySelector('.chat-workspace')).toHaveClass('discord-chat-workspace');
    expect(container.querySelector('.rooms-panel')).toBeInTheDocument();
    expect(container.querySelector('.conversation-panel')).toBeInTheDocument();
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
