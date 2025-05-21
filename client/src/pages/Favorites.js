
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';


import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const Favorites = ({ showAlert }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axios.get('/users/favorites');
        setFavorites(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        showAlert(
          err.response?.data?.error || 'Error fetching favorites',
          'error'
        );
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [showAlert]);

  const handleOpenModal = (photo) => {
    setSelectedPhoto(photo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPhoto(null);
  };

  const handleRemoveFavorite = async (photoId, e) => {
    e.stopPropagation();

    try {
      await axios.delete(`/users/favorites/${photoId}`);


      setFavorites(favorites.filter(photo => photo._id !== photoId));
      showAlert('Photo removed from favorites', 'success');
    } catch (err) {
      console.error('Error removing from favorites:', err);
      showAlert(
        err.response?.data?.error || 'Error removing from favorites',
        'error'
      );
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
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" component="h1">
          Favorite Photos
        </Typography>
      </Paper>

      {favorites.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          You haven't favorited any photos yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {favorites.map(photo => (
            <Grid item xs={6} sm={4} md={3} key={photo._id}>
              <Card
                sx={{
                  maxWidth: '100%',
                  position: 'relative',
                  '&:hover .remove-btn': {
                    opacity: 1,
                  },
                }}
              >
                <CardActionArea onClick={() => handleOpenModal(photo)}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={`http://localhost:3000${photo.file}`}
                    alt={photo.caption}
                  />
                  <IconButton
                    className="remove-btn"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      },
                    }}
                    onClick={(e) => handleRemoveFavorite(photo._id, e)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      By {photo.user.firstName} {photo.user.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(photo.dateUploaded).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Photo Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="photo-modal-title"
      >
        <Box sx={modalStyle}>
          <Box sx={{ alignSelf: 'flex-end', mb: 1 }}>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          {selectedPhoto && (
            <>
              <Box
                component="img"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
                src={`http://localhost:3000${selectedPhoto.file}`}
                alt={selectedPhoto.caption}
              />

              <Box sx={{ mt: 2, width: '100%' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedPhoto.caption}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    By{' '}
                    <Link
                      to={`/users/${selectedPhoto.user._id}`}
                      onClick={handleCloseModal}
                      style={{ textDecoration: 'none' }}
                    >
                      {selectedPhoto.user.firstName} {selectedPhoto.user.lastName}
                    </Link>
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {new Date(selectedPhoto.dateUploaded).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Favorites;