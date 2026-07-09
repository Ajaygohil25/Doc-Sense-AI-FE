import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectDetail from '../pages/projects/ProjectDetail';
import {
  getProject,
  uploadProjectFile,
} from '../services/projects';

const showToast = vi.hoisted(() => vi.fn());

vi.mock('../services/projects', () => ({
  getProject: vi.fn(),
  uploadProjectFile: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showToast,
  }),
}));

const projectPayload = {
  id: 'project-1',
  name: 'Policy KB',
  description: 'Benefits and policies',
  created_at: '2026-07-09T10:00:00',
  files: [
    {
      id: 'file-1',
      file_name: 'Policy.pdf',
      status: 'Success',
      created_at: '2026-07-09 10:10:00',
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

const renderProjectDetail = () => render(
  <MemoryRouter initialEntries={['/projects/project-1']}>
    <Routes>
      <Route path="/projects/:projectId" element={<ProjectDetail />} />
      <Route path="/projects/:projectId/chat" element={<div>Project chat route</div>} />
    </Routes>
  </MemoryRouter>
);

describe('ProjectDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showToast.mockClear();
    getProject.mockResolvedValue({
      data: {
        success: true,
        data: {
          project: projectPayload,
        },
      },
    });
  });

  it('loads project files and chat rooms', async () => {
    renderProjectDetail();

    expect(await screen.findByText('Policy KB')).toBeInTheDocument();
    expect(screen.getByText('Policy.pdf')).toBeInTheDocument();
    expect(screen.getByText('Default chat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open project chat/i })).toBeEnabled();
  });

  it('uploads one project PDF with multipart form data and refreshes project detail', async () => {
    uploadProjectFile.mockResolvedValue({
      data: {
        success: true,
        data: {
          file: {
            id: 'file-2',
            file_name: 'Finance.pdf',
            status: 'Processing',
            created_at: '2026-07-09 10:20:00',
            project_id: 'project-1',
          },
        },
      },
    });

    renderProjectDetail();

    const file = new File(['pdf'], 'Finance.pdf', { type: 'application/pdf' });
    fireEvent.change(await screen.findByLabelText('Project PDF upload'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: /upload pdf/i }));

    await waitFor(() => {
      expect(uploadProjectFile).toHaveBeenCalledWith('project-1', expect.any(FormData));
    });
    expect(getProject).toHaveBeenCalledTimes(2);
  });

  it('disables project chat until a project file has succeeded', async () => {
    getProject.mockResolvedValue({
      data: {
        success: true,
        data: {
          project: {
            ...projectPayload,
            files: [
              {
                id: 'file-processing',
                file_name: 'Processing.pdf',
                status: 'Processing',
                created_at: '2026-07-09 10:10:00',
                project_id: 'project-1',
              },
            ],
          },
        },
      },
    });

    renderProjectDetail();

    expect(await screen.findByText('Processing.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open project chat/i })).toBeDisabled();
    expect(screen.getByText(/chat is available after at least one project file finishes processing/i)).toBeInTheDocument();
  });
});
