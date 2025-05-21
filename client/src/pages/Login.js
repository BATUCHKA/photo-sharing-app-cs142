
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const Login = ({ showAlert }) => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState({
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  const { username, password } = formData;


  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: '' });
    setError(null);
  };

  const validateForm = () => {
    let valid = true;
    const errors = { username: '', password: '' };

    if (!username.trim()) {
      errors.username = 'Username is required';
      valid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo('');

    try {

      setDebugInfo(`Attempting login with username: ${username}`);

      const result = await login({ username, password });

      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.');
        if (showAlert) {
          showAlert(result.error || 'Login failed. Please check your credentials.', 'error');
        }
      } else {
        if (showAlert) {
          showAlert('Logged in successfully', 'success');
        }
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      if (showAlert) {
        showAlert('An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={onChange}
              error={!!formErrors.username}
              helperText={formErrors.username}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={onChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={loading}
            />

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Default accounts: johndoe / janesmith / bobjohnson
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Password for all: password123
            </Typography>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Don't have an account? Sign Up
                  </Typography>
                </Link>
              </Grid>
            </Grid>

            {debugInfo && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Debug info: {debugInfo}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;