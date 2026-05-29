import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  }
}));

// Test helper component to consume hook
const TestComponent = () => {
  const { user, isAuthenticated, toggleTheme, theme } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'logged-in' : 'logged-out'}</div>
      <div data-testid="user-email">{user ? user.email : 'none'}</div>
      <div data-testid="theme-val">{theme}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides default theme value', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const themeVal = screen.getByTestId('theme-val');
    // Default theme is dark as defined in our provider
    expect(themeVal.textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles CSS theme classes on theme switch click', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-theme');
    const themeVal = screen.getByTestId('theme-val');

    act(() => {
      toggleBtn.click();
    });

    expect(themeVal.textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
