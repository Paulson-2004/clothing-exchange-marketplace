// The single source of truth for authentication in the frontend.
// Exposes the `user` object and login/logout functions via the `useAuth()` hook
// so any component can check if someone is logged in without re-fetching data.
import { createContext, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `initializing` covers the one-time check on page load, before we
  // know whether the user is logged in or not. Distinct from `loading`,
  // which covers in-flight login/register actions.
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On mount, check if there's an active session by calling /auth/me.
  // WHY WE DO THIS: The JWT token is stored securely in an HTTP-Only cookie,
  // meaning our frontend JavaScript cannot read it directly. Calling /auth/me
  // asks the backend to read its own cookie and tell us who is logged in.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await axiosClient.get('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        // Not logged in, or session expired - this is a normal case,
        // not an error to surface to the user.
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const register = async ({ name, email, phone, password, location }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.post('/auth/register', {
        name,
        email,
        phone,
        password,
        location,
      });
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      // Clear local state regardless of whether the request succeeded,
      // so the UI never gets stuck showing a logged-in state.
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    initializing,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
