// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import axios from 'axios';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Alert from './components/layout/Alert';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDetail from './pages/UserDetail';
import UserPhotos from './pages/UserPhotos';
import Favorites from './pages/Favorites';
import ActivityFeed from './pages/ActivityFeed';
import NotFound from './pages/NotFound';

// Utils
import PrivateRoute from './utils/PrivateRoute';
import setAuthToken from './utils/setAuthToken';

// Set default axios baseURL
axios.defaults.baseURL = 'http://localhost:3000/api';

// Set auth token header for all requests if token exists
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Create theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });
  
  // Show alert
  const showAlert = (message, severity, timeout = 5000) => {
    setAlert({ message, severity });
    
    setTimeout(() => {
      setAlert(null);
    }, timeout);
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="app">
            <Navbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            <div className="container">
              <Sidebar />
              <main className="content">
                <Alert alert={alert} />
                <Routes>
                  <Route path="/" element={<Navigate to="/login" />} />
                  <Route path="/login" element={<Login showAlert={showAlert} />} />
                  <Route path="/register" element={<Register showAlert={showAlert} />} />
                  <Route path="/home" element={
                    <PrivateRoute>
                      <Home showAlert={showAlert} />
                    </PrivateRoute>
                  } />
                  <Route path="/users/:id" element={
                    <PrivateRoute>
                      <UserDetail showAlert={showAlert} />
                    </PrivateRoute>
                  } />
                  <Route path="/photos/user/:id" element={
                    <PrivateRoute>
                      <UserPhotos showAlert={showAlert} />
                    </PrivateRoute>
                  } />
                  <Route path="/favorites" element={
                    <PrivateRoute>
                      <Favorites showAlert={showAlert} />
                    </PrivateRoute>
                  } />
                  <Route path="/activities" element={
                    <PrivateRoute>
                      <ActivityFeed showAlert={showAlert} />
                    </PrivateRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;