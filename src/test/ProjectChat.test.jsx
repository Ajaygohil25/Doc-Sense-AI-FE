import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectChat from '../pages/projects/ProjectChat';
import {
  askProjectQuestion,
  createProjectChatRoom,
  getProject,
  getProjectChatMessages,
  listProjectChatRooms,
} from '../services/projects';
import { useSocket } from '../hooks/useSocket';

const showToast = vi.hoisted(() => vi.fn());

vi.mock('../services/projects', () => ({
  askProjectQuestion: vi.fn(),
  createProjectChatRoom: vi.fn(),
  getProject: vi.fn(),
  getProjectChatMessages: vi.fn(),
  listProjectChatRooms: vi.fn(),
}));

vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showToast,
  }),
}));

const project = {
  id: 'project-1',
  name: 'Policy KB',
  description: 'Benefits and policies',
  files: [
    {
      id: 'file-1',
      file_name: 'Policy.pdf',
      status: 'Success',
      created_at: '2026-07-09 10:00:00',
      project_id: 'project-1',
    },
  ],
  chat_rooms: [
    {
      id: 'room-1',
      project_id: 'project-1',
      name: 'Default chat',
      created_at: '2026-07-09T10:00:00',
    },
  ],
};

const roomPayload = {
  chat_rooms: project.chat_rooms,
};

const historyPayload = {
  chat_room_id: 'room-1',
  messages: [
    {
      id: 'message-1',
      room_id: 'room-1',
      sender: 'user',
      message: 'What changed?',
      created_at: '2026-07-09T10:01:00',
    },
    {
      id: 'message-2',
      room_id: 'room-1',
      sender: 'assistant',
      message: 'Stored project answer',
      created_at: '2026-07-09T10:02:00',
    },
  ],
};

const renderProjectChat = () => render(
  <MemoryRouter initialEntries={['/projects/project-1/chat']}>
    <Routes>
      <Route path="/projects/:projectId/chat" element={<ProjectChat />} />
    </Routes>
  </MemoryRouter>
);

describe('ProjectChat', () => {
  let askProjectQuestionSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    showToast.mockClear();
    askProjectQuestionSocket = vi.fn(() => true);
    useSocket.mockReturnValue({
      isConnected: true,
      lastResponse: null,
      lastStreamEvent: null,
      lastChatMessage: null,
      lastError: null,
      socketError: null,
      loadingResponse: false,
      askProjectQuestion: askProjectQuestionSocket,
      getPendingRequestCount: () => 0,
    });
    getProject.mockResolvedValue({
      data: {
        success: true,
        data: {
          project,
        },
      },
    });
    listProjectChatRooms.mockResolvedValue({
      data: {
        success: true,
        data: roomPayload,
      },
    });
    getProjectChatMessages.mockResolvedValue({
      data: {
        success: true,
        data: historyPayload,
      },
    });
  });

  it('loads project chat rooms and renders project-scoped history', async () => {
    const { container } = renderProjectChat();

    expect(await screen.findByText('Policy KB')).toBeInTheDocument();
    expect(screen.getByText('Stored project answer')).toBeInTheDocument();
    expect(getProjectChatMessages).toHaveBeenCalledWith('project-1', 'room-1');
    expect(container.querySelector('.chat-workspace')).toHaveClass('discord-chat-workspace');
    expect(container.querySelector('.rooms-panel')).toBeInTheDocument();
    expect(container.querySelector('.conversation-panel')).toBeInTheDocument();
  });

  it('creates a named project chat room and selects it', async () => {
    createProjectChatRoom.mockResolvedValue({
      data: {
        success: true,
        data: {
          chat_room: {
            id: 'room-2',
            project_id: 'project-1',
            name: 'Budget questions',
            created_at: '2026-07-09T11:00:00',
          },
        },
      },
    });

    renderProjectChat();

    fireEvent.click(await screen.findByLabelText('Create chat room'));
    fireEvent.change(screen.getByLabelText('Room name'), {
      target: { value: 'Budget questions' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(createProjectChatRoom).toHaveBeenCalledWith('project-1', {
        name: 'Budget questions',
      });
    });
    expect((await screen.findAllByText('Budget questions')).length).toBeGreaterThan(0);
  });

  it('sends project questions over Socket.IO with project scope', async () => {
    renderProjectChat();

    fireEvent.change(await screen.findByPlaceholderText(/ask a question about this project/i), {
      target: { value: 'Summarize this project' },
    });
    fireEvent.click(screen.getByTitle('Send message'));

    await waitFor(() => {
      expect(askProjectQuestionSocket).toHaveBeenCalledWith(
        'project-1',
        'room-1',
        'Summarize this project',
        expect.any(String),
      );
    });
  });

  it('uses project REST fallback when the socket is unavailable', async () => {
    useSocket.mockReturnValue({
      isConnected: false,
      lastResponse: null,
      lastStreamEvent: null,
      lastChatMessage: null,
      lastError: null,
      socketError: null,
      loadingResponse: false,
      askProjectQuestion: askProjectQuestionSocket,
      getPendingRequestCount: () => 0,
    });
    askProjectQuestion.mockResolvedValue({
      data: {
        success: true,
        data: {
          project_id: 'project-1',
          chat_room_id: 'room-1',
          question: 'Summarize this project',
          response: 'REST project answer',
        },
      },
    });

    renderProjectChat();

    fireEvent.change(await screen.findByPlaceholderText(/ask a question about this project/i), {
      target: { value: 'Summarize this project' },
    });
    fireEvent.click(screen.getByTitle('Send message'));

    await waitFor(() => {
      expect(askProjectQuestion).toHaveBeenCalledWith('project-1', {
        chat_room_id: 'room-1',
        question: 'Summarize this project',
      });
    });
    expect(askProjectQuestionSocket).not.toHaveBeenCalled();
  });
});
