import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '../components/layout/Sidebar';

const sidebarSource = fs.readFileSync(path.join(cwd(), 'src/components/layout/Sidebar.jsx'), 'utf8');
const authCss = fs.readFileSync(path.join(cwd(), 'src/pages/auth/auth.css'), 'utf8');

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
    },
    logout: vi.fn(),
    theme: 'light',
    toggleTheme: vi.fn(),
    sidebarState: 'expanded',
    setSidebarMinimized: vi.fn(),
    setSidebarExpanded: vi.fn(),
    setSidebarHidden: vi.fn(),
  }),
}));

describe('Sidebar', () => {
  it('separates the feature home route from the upload PDF route', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /upload pdf/i })).toHaveAttribute('href', '/upload');
    expect(screen.getByRole('button', { name: /toggle theme/i })).toHaveTextContent(/dark mode/i);
  });

  it('uses restrained shell hooks while retaining theme switching', () => {
    expect(sidebarSource).toContain('var(--sidebar-active-bg)');
    expect(sidebarSource).not.toMatch(/linear-gradient|radial-gradient|accent-magenta|intent-color/);
    expect(authCss).not.toMatch(/linear-gradient|radial-gradient|--mesh-|text-transform: uppercase/);
  });
});
