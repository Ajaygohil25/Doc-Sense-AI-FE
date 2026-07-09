import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import { useAuth } from './context/AuthContext';
import { useResponsive } from './hooks/useResponsive';
import { Menu } from 'lucide-react';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/dashboard/Home';
import DocumentsList from './pages/dashboard/DocumentsList';
import DocumentChat from './pages/document/DocumentChat';
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetail from './pages/projects/ProjectDetail';
import ProjectChat from './pages/projects/ProjectChat';
import Profile from './pages/profile/Profile';

import './App.css';

// Layout wrapper for authenticated pages
const AuthenticatedLayout = ({ children }) => {
  const { sidebarState, setSidebarExpanded } = useAuth();
  const { isMobile } = useResponsive();
  const location = useLocation();
  const isDocumentChatPage = /^\/documents\/[^/]+\/chat\/?$/.test(location.pathname);
  const isProjectChatPage = /^\/projects\/[^/]+\/chat\/?$/.test(location.pathname);
  const isChatPage = isDocumentChatPage || isProjectChatPage;

  return (
    <div className={`app-container sidebar-${sidebarState} ${isMobile ? 'mobile' : 'desktop'} ${isChatPage ? 'chat-layout' : ''}`}>
      {!isChatPage && <Sidebar />}
      
      {!isChatPage && sidebarState === 'hidden' && (
        <button 
          className="show-sidebar-btn"
          onClick={() => setSidebarExpanded()}
          title="Show sidebar"
          aria-label="Show sidebar menu"
        >
          <Menu size={24} />
        </button>
      )}
      
      <main className="main-content">
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes inside Authenticated Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Home />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <DocumentsList />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents/:id/chat"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <DocumentChat />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <ProjectsList />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <ProjectDetail />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:projectId/chat"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <ProjectChat />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Profile />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
