import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Default to dark theme as requested by user
    return savedTheme ? savedTheme : 'dark';
  });

  const [sidebarState, setSidebarState] = useState(() => {
    const savedSidebarState = localStorage.getItem('sidebarState');
    return savedSidebarState ? savedSidebarState : 'expanded';
  });

  // Apply CSS theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarState', sidebarState);
  }, [sidebarState]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebarState = () => {
    setSidebarState((prev) => {
      if (prev === 'expanded') return 'minimized';
      if (prev === 'minimized') return 'hidden';
      return 'expanded';
    });
  };

  const setSidebarMinimized = () => setSidebarState('minimized');
  const setSidebarHidden = () => setSidebarState('hidden');
  const setSidebarExpanded = () => setSidebarState('expanded');

  // Verify access token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Endpoint: POST /api/v1/token/verify-access-token with body { "token": token }
        const res = await api.post('/token/verify-access-token', { token });
        if (res.data.success) {
          // Fetch profile details just in case
          const profileRes = await api.get('/user/profile');
          if (profileRes.data.success) {
            const userData = profileRes.data.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.error('Initial token verification failed:', err);
        // Interceptor might have handled it or failed. If failed:
        handleLogoutLocal();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();

    // Listen to token refresh logout requests from Axios client
    const handleGlobalLogout = () => {
      handleLogoutLocal();
    };

    window.addEventListener('auth:logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth:logout', handleGlobalLogout);
    };
  }, []);

  const handleLogoutLocal = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  // Sign In: POST /api/v1/user/sign-in
  // Note: Content-Type is application/x-www-form-urlencoded
  const login = async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email); // backend oauth2 expects 'username'
    params.append('password', password);

    // Call sign-in directly using api (interceptors will handle it if needed, but sign-in is not protected)
    const res = await api.post('/user/sign-in', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Sign in returns flat token object (no success wrapper)
    const data = res.data;
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const userData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        id: data.user_id,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } else {
      throw new Error('Sign in failed to return access token');
    }
  };

  // Sign Up: POST /api/v1/user/sign-up (JSON)
  const register = async (firstName, lastName, email, password) => {
    const res = await api.post('/user/sign-up', {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });
    return res.data; // Expected: { success: true, message: "Account created successfully !" }
  };

  // Logout: POST /api/v1/user/logout
  const logout = async () => {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    
    try {
      if (access_token && refresh_token) {
        await api.post('/user/logout', { access_token, refresh_token });
      }
    } catch (err) {
      console.error('Logout request failed on server:', err);
    } finally {
      handleLogoutLocal();
    }
  };

  // Update profile: PATCH /api/v1/user/update-profile
  const updateProfile = async (firstName, lastName) => {
    const res = await api.patch('/user/update-profile', {
      first_name: firstName,
      last_name: lastName,
    });
    
    if (res.data.success) {
      // Re-fetch profile to keep local context fresh
      const profileRes = await api.get('/user/profile');
      if (profileRes.data.success) {
        const userData = profileRes.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }
    return res.data;
  };

  // Change Password: PATCH /api/v1/user/change-password
  // Succeeding will blacklist token, requiring logout
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const res = await api.patch('/user/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    
    if (res.data.success) {
      handleLogoutLocal();
    }
    return res.data;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    theme,
    toggleTheme,
    sidebarState,
    setSidebarState,
    toggleSidebarState,
    setSidebarMinimized,
    setSidebarHidden,
    setSidebarExpanded,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
