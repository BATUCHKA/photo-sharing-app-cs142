// client/src/pages/Home.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Material UI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import OutlinedInput from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';

// Icons
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

// Components
import CommentList from '../components/comments/CommentList';
import CommentForm from '../components/comments/CommentForm';

const Home = ({ showAlert }) => {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [useVisibilityControl, setUseVisibilityControl] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);
  const [commentsVisible, setCommentsVisible] = useState({});
  const [error, setError] = useState(null);
  
  // Effect to fetch photos and users when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [photosRes, usersRes] = await Promise.all([
          axios.get('/photos'),
          axios.get('/users')
        ]);
        
        setPhotos(photosRes.data);
        setUsers(usersRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching photos. Please try again later.');
        showAlert('Error fetching photos', 'error');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [showAlert]);
  
  // Handle file input change
  const handleFileChange = (e) => {
    setPhotoFile(e.target.files[0]);
  };
  
  // Handle caption change
  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
  };
  
  // Handle visibility control toggle
  const handleVisibilityControlToggle = (e) => {
    setUseVisibilityControl(e.target.checked);
    
    // If turning off visibility control, clear shared users
    if (!e.target.checked) {
      setSharedWith([]);
    }
  };
  
  // Handle shared users change
  const handleSharedUsersChange = (event) => {
    const { value } = event.target;
    setSharedWith(value);
  };
  
  // Open upload dialog
  const openUploadDialog = () => {
    setUploadDialogOpen(true);
    setPhotoFile(null);
    setCaption('');
    setUseVisibilityControl(false);
    setSharedWith([]);
  };
  
  // Close upload dialog
  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
  };
  
  // Handle photo upload
  const handleUpload = async () => {
    if (!photoFile) {
      showAlert('Please select a photo', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('caption', caption);
    
    // Add shared users if visibility control is enabled
    if (useVisibilityControl) {
      formData.append('sharedWith', JSON.stringify(sharedWith));
    }
    
    try {
      setLoading(true);
      const res = await axios.post('/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Add the new photo to the list
      setPhotos([res.data, ...photos]);
      showAlert('Photo uploaded successfully', 'success');
      closeUploadDialog();
    } catch (err) {
      console.error('Error uploading photo:', err);
      showAlert(
        err.response?.data?.error || 'Error uploading photo', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle comments visibility for a photo
  const toggleComments = (photoId) => {
    setCommentsVisible(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };
  
  // Handle like/unlike
  const handleLikeToggle = async (photoId, isLiked) => {
    try {
      let res;
      
      if (isLiked) {
        // Unlike
        res = await axios.delete(`/photos/${photoId}/like`);
      } else {
        // Like
        res = await axios.post(`/photos/${photoId}/like`);
      }
      
      // Update the photos state with the updated photo
      setPhotos(photos.map(photo => 
        photo._id === photoId ? res.data : photo
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
      showAlert(
        err.response?.data?.error || 'Error toggling like', 
        'error'
      );
    }
  };
  
  // Handle delete photo
  const handleDeletePhoto = async (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await axios.delete(`/photos/${photoId}`);
        
        // Remove the photo from the list
        setPhotos(photos.filter(photo => photo._id !== photoId));
        showAlert('Photo deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting photo:', err);
        showAlert(
          err.response?.data?.error || 'Error deleting photo', 
          'error'
        );
      }
    }
  };
  
  // Add a comment
  const handleAddComment = (photoId, newComment) => {
    setPhotos(photos.map(photo => {
      if (photo._id === photoId) {
        return {
          ...photo,
          comments: [...photo.comments, newComment]
        };
      }
      return photo;
    }));
  };
  
  // Delete a comment
  const handleDeleteComment = async (commentId, photoId) => {
    try {
      await axios.delete(`/comments/${commentId}`);
      
      // Update the photos state by removing the deleted comment
      setPhotos(photos.map(photo => {
        if (photo._id === photoId) {
          return {
            ...photo,
            comments: photo.comments.filter(comment => comment._id !== commentId)
          };
        }
        return photo;
      }));
      
      showAlert('Comment deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting comment:', err);
      showAlert(
        err.response?.data?.error || 'Error deleting comment', 
        'error'
      );
    }
  };
  
  // Add to favorites
  const handleAddToFavorites = async (photoId) => {
    try {
      await axios.post(`/users/favorites/${photoId}`);
      showAlert('Added to favorites', 'success');
    } catch (err) {
      console.error('Error adding to favorites:', err);
      showAlert(
        err.response?.data?.error || 'Error adding to favorites', 
        'error'
      );
    }
  };
  
  // Check if a photo is liked by the current user
  const isPhotoLikedByUser = (photo) => {
    return photo.likes?.some(like => like._id === user?._id);
  };
  
  // Get visibility icon based on sharing settings
  const getVisibilityIcon = (photo) => {
    if (!photo.sharedWith || photo.sharedWith.length === 0) {
      return <VisibilityIcon fontSize="small" />;
    } else if (photo.user._id === user?._id || photo.sharedWith.some(u => u._id === user?._id)) {
      return <PeopleIcon fontSize="small" />;
    } else {
      return <VisibilityOffIcon fontSize="small" />;
    }
  };
  
  // Get visibility text based on sharing settings
  const getVisibilityText = (photo) => {
    if (!photo.sharedWith || photo.sharedWith.length === 0) {
      return 'Public';
    } else if (photo.sharedWith.length > 0) {
      return `Shared with ${photo.sharedWith.length} user${photo.sharedWith.length > 1 ? 's' : ''}`;
    } else {
      return 'Private';
    }
  };
  
  if (loading) {
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
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3 
        }}
      >
        <Typography variant="h4" component="h1">
          Photo Feed
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openUploadDialog}
        >
          Upload Photo
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {photos.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No photos to display.
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {photos.map(photo => (
            <Grid item xs={12} sm={6} md={4} key={photo._id}>
              <Card sx={{ maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  avatar={
                    <Avatar component={Link} to={`/users/${photo.user._id}`}>
                      {photo.user.firstName[0]}{photo.user.lastName[0]}
                    </Avatar>
                  }
                  action={
                    photo.user._id === user?._id && (
                      <IconButton 
                        aria-label="delete"
                        onClick={() => handleDeletePhoto(photo._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )
                  }
                  title={
                    <Link 
                      to={`/users/${photo.user._id}`} 
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {photo.user.firstName} {photo.user.lastName}
                    </Link>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(photo.dateUploaded).toLocaleString()}
                      </Typography>
                      <Tooltip title={getVisibilityText(photo)}>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                          {getVisibilityIcon(photo)}
                        </Box>
                      </Tooltip>
                    </Box>
                  }
                />
                <CardMedia
                  component="img"
                  height="300"
                  image={`http://localhost:3000${photo.file}`}
                  alt={photo.caption}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {photo.caption}
                  </Typography>
                </CardContent>
                <CardActions disableSpacing>
                  <IconButton 
                    aria-label="add to favorites"
                    onClick={() => handleLikeToggle(photo._id, isPhotoLikedByUser(photo))}
                    color={isPhotoLikedByUser(photo) ? 'secondary' : 'default'}
                  >
                    {isPhotoLikedByUser(photo) ? (
                      <FavoriteIcon />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {photo.likes?.length || 0}
                  </Typography>
                  <IconButton 
                    aria-label="comments"
                    onClick={() => toggleComments(photo._id)}
                    sx={{ ml: 1 }}
                  >
                    <ChatBubbleOutlineIcon />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {photo.comments?.length || 0}
                  </Typography>
                  
                  {/* Add to favorites button */}
                  {photo.user._id !== user?._id && (
                    <IconButton
                      aria-label="add to favorites"
                      onClick={() => handleAddToFavorites(photo._id)}
                      sx={{ ml: 'auto' }}
                      color="primary"
                    >
                      <BookmarkBorderIcon />
                    </IconButton>
                  )}
                </CardActions>
                
                {commentsVisible[photo._id] && (
                  <Box sx={{ p: 2, pt: 0 }}>
                    <CommentList 
                      comments={photo.comments} 
                      photoId={photo._id}
                      currentUser={user}
                      onDeleteComment={handleDeleteComment}
                    />
                    <CommentForm 
                      photoId={photo._id} 
                      onAddComment={handleAddComment}
                      showAlert={showAlert}
                    />
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={closeUploadDialog}>
        <DialogTitle>Upload Photo</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mt: 2, mb: 2 }}
            >
              Select Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            
            {photoFile && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selected file: {photoFile.name}
              </Typography>
            )}
            
            <TextField
              margin="normal"
              fullWidth
              id="caption"
              label="Caption"
              name="caption"
              multiline
              rows={3}
              value={caption}
              onChange={handleCaptionChange}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={useVisibilityControl}
                  onChange={handleVisibilityControlToggle}
                  color="primary"
                />
              }
              label="Restrict who can see this photo"
              sx={{ mt: 2, mb: 1 }}
            />
            
            {useVisibilityControl && (
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="shared-with-label">
                  {sharedWith.length === 0 
                    ? 'Only you can see this photo' 
                    : 'Share with specific users'}
                </InputLabel>
                <Select
                  labelId="shared-with-label"
                  id="shared-with"
                  multiple
                  value={sharedWith}
                  onChange={handleSharedUsersChange}
                  input={<OutlinedInput id="select-multiple-chip" label={sharedWith.length === 0 ? 'Only you can see this photo' : 'Share with specific users'} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((userId) => {
                        const selectedUser = users.find(u => u._id === userId);
                        return (
                          <Chip 
                            key={userId} 
                            label={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : userId} 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {users.filter(u => u._id !== user?._id).map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </Avatar>
                      {u.firstName} {u.lastName}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  {sharedWith.length === 0 
                    ? 'If you don\'t select any users, only you will be able to see this photo.' 
                    : `This photo will be visible to you and ${sharedWith.length} selected user${sharedWith.length > 1 ? 's' : ''}.`}
                </Typography>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!photoFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;