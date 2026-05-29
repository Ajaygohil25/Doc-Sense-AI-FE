import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import * as AuthContext from '../context/AuthContext';

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('ProtectedRoute Component', () => {
  it('renders loading spinner when auth state is loading', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Expect to see the spinner styles or wrapper container
    const protectedContent = screen.queryByText('Protected Content');
    expect(protectedContent).not.toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should display 'Login Page' due to redirect
    const loginText = screen.getByText('Login Page');
    expect(loginText).toBeInTheDocument();
    
    const protectedContent = screen.queryByText('Protected Content');
    expect(protectedContent).not.toBeInTheDocument();
  });

  it('renders child components when user is authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Should display the children elements
    const protectedContent = screen.getByText('Protected Content');
    expect(protectedContent).toBeInTheDocument();
  });
});
