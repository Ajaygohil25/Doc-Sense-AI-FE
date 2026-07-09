import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSocket } from '../hooks/useSocket';

const emit = vi.hoisted(() => vi.fn());
const disconnect = vi.hoisted(() => vi.fn());
const handlers = vi.hoisted(() => new Map());

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    id: 'socket-1',
    emit,
    disconnect,
    on: vi.fn((event, handler) => {
      handlers.set(event, handler);
    }),
  })),
}));

vi.mock('../services/api', () => ({
  API_URL: 'http://localhost:8000',
}));

describe('useSocket scoped question emitters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlers.clear();
    localStorage.setItem('access_token', 'token-1');
  });

  it('keeps file questions file-scoped', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      handlers.get('connect')();
    });

    act(() => {
      result.current.askQuestion('file-1', 'room-1', 'Explain file', 'msg-1');
    });

    expect(emit).toHaveBeenCalledWith('ask_question', {
      file_id: 'file-1',
      chat_room_id: 'room-1',
      question: 'Explain file',
      request_id: 'msg-1',
    });
  });

  it('emits project questions with project_id and no file_id', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      handlers.get('connect')();
    });

    act(() => {
      result.current.askProjectQuestion('project-1', 'room-1', 'Explain project', 'msg-2');
    });

    expect(emit).toHaveBeenCalledWith('ask_question', {
      project_id: 'project-1',
      chat_room_id: 'room-1',
      question: 'Explain project',
      request_id: 'msg-2',
    });
    expect(emit.mock.calls.at(-1)[1]).not.toHaveProperty('file_id');
  });
});
