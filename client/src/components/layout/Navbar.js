// client/src/components/layout/Navbar.js
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
import { AuthContext } from '../../context/AuthContext';

const Navbar = ({ toggleDarkMode, darkMode }) => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <AppBar position="static">
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
            >
              Activities
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              to="/favorites" 
              startIcon={<FavoriteIcon />}
            >
              Favorites
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              to={`/users/${user?._id}`}
            >
              Profile
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