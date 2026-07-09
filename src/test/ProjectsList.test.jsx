import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectsList from '../pages/projects/ProjectsList';
import {
  createProject,
  listProjects,
} from '../services/projects';

const showToast = vi.hoisted(() => vi.fn());

vi.mock('../services/projects', () => ({
  createProject: vi.fn(),
  listProjects: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showToast,
  }),
}));

const renderProjectsList = () => render(
  <MemoryRouter initialEntries={['/projects']}>
    <Routes>
      <Route path="/projects" element={<ProjectsList />} />
      <Route path="/projects/:projectId" element={<div>Project detail route</div>} />
    </Routes>
  </MemoryRouter>
);

describe('ProjectsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showToast.mockClear();
    listProjects.mockResolvedValue({
      data: {
        success: true,
        data: {
          projects: [
            {
              id: 'project-1',
              name: 'Policy KB',
              description: 'Benefits and policies',
              created_at: '2026-07-09T10:00:00',
            },
          ],
        },
      },
    });
  });

  it('loads projects and opens a project detail route', async () => {
    renderProjectsList();

    expect(await screen.findByText('Policy KB')).toBeInTheDocument();
    expect(screen.getByText('Benefits and policies')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open project/i }));

    expect(await screen.findByText('Project detail route')).toBeInTheDocument();
  });

  it('creates a project and inserts it into the list', async () => {
    createProject.mockResolvedValue({
      data: {
        success: true,
        data: {
          project: {
            id: 'project-2',
            name: 'Finance KB',
            description: null,
            created_at: '2026-07-09T11:00:00',
            files: [],
            chat_rooms: [
              {
                id: 'room-2',
                project_id: 'project-2',
                name: 'Default chat',
                created_at: '2026-07-09T11:00:00',
              },
            ],
          },
        },
      },
    });

    renderProjectsList();

    fireEvent.click(await screen.findByRole('button', { name: /new project/i }));
    fireEvent.change(screen.getByLabelText('Project name'), {
      target: { value: 'Finance KB' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith({
        name: 'Finance KB',
        description: null,
      });
    });

    expect(await screen.findByText('Finance KB')).toBeInTheDocument();
  });

  it('shows an empty state when no projects exist', async () => {
    listProjects.mockResolvedValue({
      data: {
        success: true,
        data: {
          projects: [],
        },
      },
    });

    renderProjectsList();

    expect(await screen.findByText('No projects yet')).toBeInTheDocument();
  });
});
