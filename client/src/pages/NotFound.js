
import React from 'react';
import { Link } from 'react-router-dom';


import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';


import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500
        }}
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2 }} />

        <Typography variant="h4" component="h1" gutterBottom>
          Page Not Found
        </Typography>

        <Typography variant="body1" textAlign="center" mb={3}>
          The page you are looking for does not exist or has been moved.
        </Typography>

        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          component={Link}
          to="/home"
        >
          Back to Home
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;