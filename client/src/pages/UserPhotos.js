
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';


import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';


import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


import CommentList from '../components/comments/CommentList';
import CommentForm from '../components/comments/CommentForm';

const UserPhotos = ({ showAlert }) => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsVisible, setCommentsVisible] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {

        const [userRes, photosRes] = await Promise.all([
          axios.get(`/users/${id}`),
          axios.get(`/photos/user/${id}`)
        ]);

        setUserInfo(userRes.data.user);
        setPhotos(photosRes.data);

        console.log('Current user:', currentUser);
        console.log('Fetched photos:', photosRes.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        showAlert(
          err.response?.data?.error || 'Error fetching user photos',
          'error'
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [id, showAlert, currentUser]);


  const toggleComments = (photoId) => {
    setCommentsVisible(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };


  const handleLikeToggle = async (photoId, isLiked) => {
    try {
      let res;

      if (isLiked) {

        console.log('Unliking photo:', photoId);
        res = await axios.delete(`/photos/${photoId}/like`);
      } else {

        console.log('Liking photo:', photoId);
        res = await axios.post(`/photos/${photoId}/like`);
      }

      console.log('Like toggle response:', res.data);


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


  const handleDeletePhoto = async (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await axios.delete(`/photos/${photoId}`);


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


  const handleDeleteComment = async (commentId, photoId) => {
    try {
      await axios.delete(`/comments/${commentId}`);


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


  const isPhotoLikedByUser = (photo) => {

    if (!currentUser || !photo.likes || !Array.isArray(photo.likes)) {
      return false;
    }



    return photo.likes.some(like =>

      (like._id === currentUser._id) ||
      (like.user && like.user === currentUser._id) || // If like has separate user field
      (like.user && like.user._id === currentUser._id) || // If like.user is an object
      (like === currentUser._id)
    );
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

  if (!userInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          User not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, mt: 2 }}>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            component={Link}
            to={`/users/${id}`}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Profile
          </Button>

          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {userInfo.firstName[0]}{userInfo.lastName[0]}
          </Avatar>

          <Typography variant="h5" component="h1">
            {userInfo.firstName} {userInfo.lastName}'s Photos
          </Typography>
        </Box>
      </Paper>

      {photos.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No photos to display.
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {photos.map(photo => {

            const liked = isPhotoLikedByUser(photo);
            console.log(`Photo ${photo._id} liked status:`, liked);
            console.log(`Photo ${photo._id} likes:`, photo.likes);

            return (
              <Grid item xs={12} sm={6} md={4} key={photo._id}>
                <Card sx={{ maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={`http://localhost:3000${photo.file}`}
                    alt={photo.caption}
                    sx={{
                      objectFit: 'cover',
                      backgroundColor: 'rgba(0,0,0,0.05)'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300?text=Photo+Not+Found';
                    }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {photo.caption}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(photo.dateUploaded).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions disableSpacing>
                    <IconButton
                      aria-label={liked ? 'unlike' : 'like'}
                      onClick={() => handleLikeToggle(photo._id, liked)}
                      color={liked ? 'secondary' : 'default'}
                    >
                      {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
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

                    {(currentUser && photo.user && (photo.user._id === currentUser._id || photo.user === currentUser._id)) && (
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDeletePhoto(photo._id)}
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </CardActions>

                  {commentsVisible[photo._id] && (
                    <Box sx={{ p: 2, pt: 0 }}>
                      <CommentList
                        comments={photo.comments}
                        photoId={photo._id}
                        currentUser={currentUser}
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
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default UserPhotos;