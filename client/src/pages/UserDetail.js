// client/src/pages/UserDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Material UI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import PhotoIcon from '@mui/icons-material/Photo';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import EmailIcon from '@mui/icons-material/Email';

const UserDetail = ({ showAlert }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, deleteAccount } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data for ID:', id);
        setLoading(true);
        setError(null);
        
        const res = await axios.get(`/users/${id}`);
        console.log('User data response:', res.data);
        
        setUserData(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.response?.data?.error || 'Error fetching user data');
        setLoading(false);
        showAlert(
          err.response?.data?.error || 'Error fetching user data', 
          'error'
        );
      }
    };
    
    if (id) {
      fetchUserData();
    }
  }, [id, showAlert]);
  
  const handleDeleteAccount = async () => {
    try {
      const result = await deleteAccount();
      
      if (result.success) {
        showAlert('Account deleted successfully', 'success');
        navigate('/login');
      } else {
        showAlert(result.error || 'Failed to delete account', 'error');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      showAlert('Error deleting account', 'error');
    }
  };
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        mt={10} // Added margin top to account for navbar
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10 }}> {/* Added margin top */}
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" component={Link} to="/home">
          Back to Home
        </Button>
      </Container>
    );
  }
  
  if (!userData || !userData.user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10 }}> {/* Added margin top */}
        <Typography variant="h5" color="error">
          User not found
        </Typography>
        <Button variant="contained" component={Link} to="/home" sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Container>
    );
  }
  
  const { user: userInfo, mostRecentPhoto, mostCommentedPhoto, mentionedPhotos, lastActivity } = userData;
  const isOwnProfile = currentUser?._id === userInfo._id;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 10 }}> {/* Added margin top and Container for better layout */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' } }}>
          <Avatar 
            sx={{ 
              width: 100, 
              height: 100, 
              mr: { xs: 0, sm: 3 }, 
              mb: { xs: 2, sm: 0 }, 
              fontSize: '2rem',
              bgcolor: 'primary.main'
            }}
          >
            {userInfo.firstName && userInfo.lastName ? 
              `${userInfo.firstName[0]}${userInfo.lastName[0]}` : 'U'}
          </Avatar>
          
          <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h4" component="h1">
              {userInfo.firstName} {userInfo.lastName}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                @{userInfo.username}
              </Typography>
            </Box>
            
            {userInfo.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                  {userInfo.email}
                </Typography>
              </Box>
            )}
            
            {userInfo.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                  {userInfo.location}
                </Typography>
              </Box>
            )}
            
            {userInfo.occupation && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                  {userInfo.occupation}
                </Typography>
              </Box>
            )}
            
            {isOwnProfile && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                sx={{ mt: 2 }}
                onClick={() => setConfirmDialogOpen(true)}
              >
                Delete Account
              </Button>
            )}
          </Box>
          
          <Button
            variant="contained"
            component={Link}
            to={`/photos/user/${userInfo._id}`}
            startIcon={<PhotoIcon />}
            sx={{ mt: { xs: 2, sm: 0 } }}
          >
            View Photos
          </Button>
        </Box>
        
        {userInfo.description && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1">
              {userInfo.description}
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Grid container spacing={4}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            
            {lastActivity ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {lastActivity.type === 'PHOTO_UPLOAD' && <PhotoIcon color="primary" sx={{ mr: 1 }} />}
                  {lastActivity.type === 'COMMENT_ADDED' && <CommentIcon color="secondary" sx={{ mr: 1 }} />}
                  <Typography variant="body1">
                    {lastActivity.type.replace(/_/g, ' ').toLowerCase()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {new Date(lastActivity.date).toLocaleString()}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent activity.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Recently Uploaded Photo */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Most Recently Uploaded Photo
            </Typography>
            
            {mostRecentPhoto ? (
              <Card sx={{ maxWidth: 345 }}>
                <CardActionArea component={Link} to={`/photos/user/${userInfo._id}`}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={`http://localhost:3000${mostRecentPhoto.file}`}
                    alt="Most recent photo"
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded on {new Date(mostRecentPhoto.dateUploaded).toLocaleString()}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No photos uploaded yet.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Most Commented Photo */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Most Commented Photo
            </Typography>
            
            {mostCommentedPhoto ? (
              <Card sx={{ maxWidth: 345 }}>
                <CardActionArea component={Link} to={`/photos/user/${userInfo._id}`}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={`http://localhost:3000${mostCommentedPhoto.file}`}
                    alt="Most commented photo"
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CommentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {mostCommentedPhoto.comments.length} comments
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No commented photos.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* @Mentions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              <AlternateEmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Mentioned In
            </Typography>
            
            {mentionedPhotos && mentionedPhotos.length > 0 ? (
              <Grid container spacing={2}>
                {mentionedPhotos.map(photo => (
                  <Grid item xs={6} sm={4} key={photo._id}>
                    <Card>
                      <CardActionArea component={Link} to={`/photos/user/${photo.user._id}`}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={`http://localhost:3000${photo.file}`}
                          alt="Mentioned photo"
                        />
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" noWrap>
                            By {photo.user.firstName} {photo.user.lastName}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Not mentioned in any photos.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your photos, comments, and other data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserDetail;