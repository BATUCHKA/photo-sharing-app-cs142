// client/src/context/AuthContext.js
import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';

// Create context
export const AuthContext = createContext();

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload
      };
    case 'REGISTER_SUCCESS':
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      setAuthToken(action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        user: action.payload.user
      };
    case 'REGISTER_FAIL':
    case 'LOGIN_FAIL':
    case 'AUTH_ERROR':
    case 'LOGOUT':
    case 'ACCOUNT_DELETED':
      localStorage.removeItem('token');
      setAuthToken(null);
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        setAuthToken(localStorage.token);

        try {
          const res = await axios.get('/auth/profile');

          dispatch({
            type: 'USER_LOADED',
            payload: res.data
          });
        } catch (err) {
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'AUTH_ERROR' });
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post('/auth/register', userData);

      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data
      });

      return { success: true };
    } catch (err) {
      dispatch({
        type: 'REGISTER_FAIL'
      });

      return {
        success: false,
        error: err.response && err.response.data.error
          ? err.response.data.error
          : 'Registration failed'
      };
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      const res = await axios.post('/auth/login', userData);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });

      return { success: true };
    } catch (err) {
      dispatch({
        type: 'LOGIN_FAIL'
      });

      return {
        success: false,
        error: err.response && err.response.data.error
          ? err.response.data.error
          : 'Login failed'
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (state.isAuthenticated) {
        await axios.post('/auth/logout');
      }

      dispatch({ type: 'LOGOUT' });
      return { success: true };
    } catch (err) {
      dispatch({ type: 'LOGOUT' });
      return { success: true }; // Always logout on client side even if server fails
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      await axios.delete('/users');

      dispatch({ type: 'ACCOUNT_DELETED' });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response && err.response.data.error
          ? err.response.data.error
          : 'Failed to delete account'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        user: state.user,
        register,
        login,
        logout,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};