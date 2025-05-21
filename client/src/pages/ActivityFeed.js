
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';


import RefreshIcon from '@mui/icons-material/Refresh';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CommentIcon from '@mui/icons-material/Comment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

const ActivityFeed = ({ showAlert }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/activities?limit=5');
      setActivities(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Error fetching activities. Please try again.');
      showAlert(
        err.response?.data?.error || 'Error fetching activities',
        'error'
      );
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchActivities();


    const interval = setInterval(() => {
      fetchActivities();
    }, 30000);

    setRefreshInterval(interval);


    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [showAlert]);


  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const handleRefresh = () => {
    fetchActivities();
  };


  const renderActivityIcon = (activity) => {
    switch (activity.type) {
      case 'PHOTO_UPLOAD':
        return <PhotoCameraIcon />;
      case 'COMMENT_ADDED':
        return <CommentIcon />;
      case 'USER_REGISTERED':
        return <PersonAddIcon />;
      case 'USER_LOGIN':
        return <LoginIcon />;
      case 'USER_LOGOUT':
        return <LogoutIcon />;
      default:
        return null;
    }
  };


  const formatActivityText = (activity) => {
    if (!activity.user) {
      return 'Unknown activity';
    }

    const userName = `${activity.user.firstName} ${activity.user.lastName}`;

    switch (activity.type) {
      case 'PHOTO_UPLOAD':
        return `${userName} uploaded a new photo`;
      case 'COMMENT_ADDED':
        return `${userName} commented on a photo`;
      case 'USER_REGISTERED':
        return `${userName} registered to the platform`;
      case 'USER_LOGIN':
        return `${userName} logged in`;
      case 'USER_LOGOUT':
        return `${userName} logged out`;
      default:
        return 'Unknown activity';
    }
  };


  const getRelativeTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (loading && activities.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Recent Activities
          </Typography>

          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            variant="outlined"
          >
            {loading ? <CircularProgress size={24} /> : 'Refresh'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && activities.length > 0 ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : activities.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No recent activities to display.
        </Typography>
      ) : (
        <Paper elevation={2}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity._id || index}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ py: 2 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      component={Link}
                      to={`/users/${activity.user?._id}`}
                      sx={{
                        bgcolor:
                          activity.type === 'PHOTO_UPLOAD' ? 'primary.main' :
                            activity.type === 'COMMENT_ADDED' ? 'secondary.main' :
                              'success.main'
                      }}
                    >
                      {renderActivityIcon(activity)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography component="span" variant="body1">
                        {activity.user && (
                          <Link
                            to={`/users/${activity.user._id}`}
                            style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
                          >
                            {activity.user.firstName} {activity.user.lastName}
                          </Link>
                        )}
                        {' • '}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {getRelativeTime(activity.date)}
                        </Typography>
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {formatActivityText(activity)}
                        </Typography>

                        {activity.type === 'PHOTO_UPLOAD' && activity.photo && (
                          <Card sx={{ maxWidth: 300 }}>
                            <CardMedia
                              component={Link}
                              to={`/photos/user/${activity.user?._id}`}
                              sx={{
                                height: 150,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                transition: 'transform 0.3s',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                },
                              }}
                              image={`http://localhost:3000${activity.photo.file}`}
                            />
                          </Card>
                        )}

                        {activity.type === 'COMMENT_ADDED' && activity.comment && activity.comment.photo && (
                          <Box>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                              "{activity.comment.text}"
                            </Typography>
                            <Card sx={{ maxWidth: 200 }}>
                              <CardMedia
                                component={Link}
                                to={`/photos/user/${activity.comment.photo.user}`}
                                sx={{
                                  height: 100,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }}
                                image={`http://localhost:3000/${activity.comment.photo.file}`}
                              />
                            </Card>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Activities refresh automatically every 30 seconds
      </Typography>
    </Box>
  );
};

export default ActivityFeed;