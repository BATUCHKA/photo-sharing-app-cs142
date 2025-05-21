// client/src/components/layout/Sidebar.js
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

// Material UI
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Toolbar from '@mui/material/Toolbar'; // Added for spacing below AppBar

// Icons
import PersonIcon from '@mui/icons-material/Person';
import PhotoIcon from '@mui/icons-material/Photo';
import CommentIcon from '@mui/icons-material/Comment';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HowToRegIcon from '@mui/icons-material/HowToReg';

const drawerWidth = 240;

const Sidebar = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [userActivities, setUserActivities] = useState({});
  
  // Fetch all users and their last activities
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/users');
        setUsers(res.data);
        
        // Fetch last activity for each user
        const activities = {};
        for (const user of res.data) {
          try {
            const activityRes = await axios.get(`/activities/user/${user._id}?limit=1`);
            if (activityRes.data.length > 0) {
              activities[user._id] = activityRes.data[0];
            }
          } catch (err) {
            console.error(`Error fetching activity for user ${user._id}:`, err);
          }
        }
        
        setUserActivities(activities);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);
  
  // Function to render activity icon based on type
  const renderActivityIcon = (activity) => {
    if (!activity) return null;
    
    switch (activity.type) {
      case 'PHOTO_UPLOAD':
        return <PhotoIcon color="primary" fontSize="small" />;
      case 'COMMENT_ADDED':
        return <CommentIcon color="secondary" fontSize="small" />;
      case 'USER_REGISTERED':
        return <HowToRegIcon color="success" fontSize="small" />;
      case 'USER_LOGIN':
        return <LoginIcon color="info" fontSize="small" />;
      case 'USER_LOGOUT':
        return <LogoutIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };
  
  // Format activity date to show time elapsed
  const formatActivityTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now - activityDate;
    
    // Convert to minutes, hours, days
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: 'none',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar /> {/* This empty toolbar pushes content below the AppBar */}
      
      {user && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              sx={{ 
                mr: 1, 
                bgcolor: 'primary.main',
                width: 40,
                height: 40
              }}
            >
              {user.firstName && user.lastName ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </Avatar>
            <Typography variant="h6" noWrap>
              {user.firstName} {user.lastName}
            </Typography>
          </Box>
          {userActivities[user._id] && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ ml: 1 }}>
                Last activity: {userActivities[user._id].type.replace(/_/g, ' ').toLowerCase()} {formatActivityTime(userActivities[user._id].date)}
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      <Divider />
      
      <Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>
        Users
      </Typography>
      
      <List sx={{ 
        maxHeight: 'calc(100vh - 250px)', // Adjust to fit the window
        overflowY: 'auto'
      }}>
        {users.map((u) => (
          <ListItem key={u._id} disablePadding>
            <ListItemButton component={Link} to={`/users/${u._id}`}>
              <ListItemIcon>
                <Badge
                  badgeContent={renderActivityIcon(userActivities[u._id])}
                  overlap="circular"
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: u._id === user?._id ? 'primary.main' : 'secondary.main'
                    }}
                  >
                    {u.firstName && u.lastName ? `${u.firstName[0]}${u.lastName[0]}` : 'U'}
                  </Avatar>
                </Badge>
              </ListItemIcon>
              <ListItemText 
                primary={`${u.firstName} ${u.lastName}`} 
                secondary={
                  userActivities[u._id] 
                    ? `${userActivities[u._id].type.replace(/_/g, ' ').toLowerCase()} ${formatActivityTime(userActivities[u._id].date)}` 
                    : 'No recent activity'
                }
                primaryTypographyProps={{
                  variant: 'body2',
                  noWrap: true,
                  fontWeight: u._id === user?._id ? 'bold' : 'normal'
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  noWrap: true
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;