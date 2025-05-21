
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Avatar from '@mui/material/Avatar';
import { AuthContext } from '../../context/AuthContext';

const Navbar = ({ toggleDarkMode, darkMode, showAlert }) => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    if (showAlert) showAlert('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <PhotoCameraIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to={isAuthenticated ? '/home' : '/login'} style={{ textDecoration: 'none', color: 'white' }}>
            Photo Sharing App
          </Link>
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              component={Link}
              to="/activities"
              startIcon={<NotificationsIcon />}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Activities
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/favorites"
              startIcon={<FavoriteIcon />}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Favorites
            </Button>

            <Button
              color="inherit"
              component={Link}
              to={`/users/${user?._id}`}
              sx={{
                ml: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {user && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1,
                    bgcolor: 'secondary.main'
                  }}
                >
                  {user.firstName && user.lastName
                    ? `${user.firstName[0]}${user.lastName[0]}`
                    : 'U'}
                </Avatar>
              )}
              <Typography
                variant="body1"
                sx={{
                  display: { xs: 'none', md: 'block' }
                }}
              >
                Profile
              </Typography>
            </Button>

            <Button
              color="inherit"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box>
            <Button
              color="inherit"
              component={Link}
              to="/login"
            >
              Login
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/register"
            >
              Register
            </Button>
          </Box>
        )}

        <IconButton sx={{ ml: 1 }} onClick={toggleDarkMode} color="inherit">
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;