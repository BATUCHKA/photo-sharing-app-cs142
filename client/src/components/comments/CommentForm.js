// client/src/components/comments/CommentForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Material UI
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const CommentForm = ({ photoId, onAddComment, showAlert }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch users for @mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError(null);
        const res = await axios.get('/users');
        setUsers(res.data);
        setLoadingUsers(false);
      } catch (err) {
        console.error('Error fetching users for mentions:', err);
        setError('Error loading users for mentions');
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleTextChange = (e) => {
    setText(e.target.value);
  };
  
  const handleUserMention = (user) => {
    // Add username to the text at cursor position
    if (user) {
      setText((prevText) => `${prevText} @${user.username} `);
      
      // Only add user if not already mentioned
      if (!mentionedUsers.some(u => u._id === user._id)) {
        setMentionedUsers([...mentionedUsers, user]);
      }
    }
  };
  
  const handleRemoveMention = (userId) => {
    // Remove the mention chip
    const updatedMentions = mentionedUsers.filter(u => u._id !== userId);
    setMentionedUsers(updatedMentions);
    
    // Remove the @username from the text
    const userToRemove = mentionedUsers.find(u => u._id === userId);
    if (userToRemove) {
      const regex = new RegExp(`@${userToRemove.username}\\s`, 'g');
      setText(text.replace(regex, ''));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create an array of mentioned user IDs to send to the server
      const mentionIds = mentionedUsers.map(user => user._id);
      
      const res = await axios.post(`/comments/${photoId}`, { 
        text,
        mentions: mentionIds
      });
      
      // Clear form
      setText('');
      setMentionedUsers([]);
      
      // Update parent component
      onAddComment(photoId, res.data);
      
      showAlert('Comment added successfully', 'success');
    } catch (err) {
      console.error('Error adding comment:', err);
      showAlert(
        err.response?.data?.error || 'Error adding comment', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TextField
        fullWidth
        label="Add a comment"
        value={text}
        onChange={handleTextChange}
        multiline
        rows={2}
        variant="outlined"
        disabled={loading}
        placeholder="Type your comment here. Use @username to mention users."
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
        <Typography variant="caption" sx={{ mr: 1 }}>
          Mention:
        </Typography>
        <Autocomplete
          options={users}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName} (@${option.username})`}
          renderOption={(props, option) => (
            <li {...props}>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                {option.firstName[0]}{option.lastName[0]}
              </Avatar>
              {option.firstName} {option.lastName} (@{option.username})
            </li>
          )}
          renderInput={(params) => (
            <TextField 
              {...params} 
              variant="outlined" 
              size="small" 
              label="@username" 
              sx={{ minWidth: 200 }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          onChange={(event, newValue) => handleUserMention(newValue)}
          loading={loadingUsers}
          sx={{ mr: 2 }}
          disabled={loading}
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          disabled={loading || !text.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Post'}
        </Button>
      </Box>
      
      {mentionedUsers.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {mentionedUsers.map((user) => (
            <Chip
              key={user._id}
              label={`@${user.username}`}
              size="small"
              onDelete={() => handleRemoveMention(user._id)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CommentForm;