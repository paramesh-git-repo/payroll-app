import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/axios';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set axios default header
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Load user on app start
  useEffect(() => {
    if (state.token) {
      loadUser();
    } else {
      dispatch({ type: 'AUTH_FAIL', payload: null });
    }
  }, []);

  const loadUser = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      const res = await api.get('/api/auth/me');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: res.data.user,
          token: state.token
        }
      });
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || 'Authentication failed' });
      localStorage.removeItem('token');
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const res = await api.post('/api/auth/login', { email, password });
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAIL', payload: message });
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const res = await api.post('/api/auth/register', userData);
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAIL', payload: message });
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/api/auth/profile', profileData);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: res.data.user,
          token: state.token
        }
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await api.put('/api/auth/change-password', passwordData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      return { success: false, message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateProfile,
    changePassword,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
