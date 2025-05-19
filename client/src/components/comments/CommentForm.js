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

const CommentForm = ({ photoId, onAddComment, showAlert }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  
  // Fetch users for @mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users for mentions:', err);
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
      setMentionedUsers([...mentionedUsers, user]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await axios.post(`/comments/${photoId}`, { text });
      
      // Clear form
      setText('');
      setMentionedUsers([]);
      
      // Update parent component
      onAddComment(photoId, res.data);
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
      <TextField
        fullWidth
        label="Add a comment"
        value={text}
        onChange={handleTextChange}
        multiline
        rows={2}
        variant="outlined"
        disabled={loading}
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
            />
          )}
          onChange={(event, newValue) => handleUserMention(newValue)}
          sx={{ mr: 2 }}
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          disabled={loading || !text.trim()}
        >
          Post
        </Button>
      </Box>
      
      {mentionedUsers.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {mentionedUsers.map((user) => (
            <Chip
              key={user._id}
              label={`@${user.username}`}
              size="small"
              onDelete={() => {
                setMentionedUsers(mentionedUsers.filter(u => u._id !== user._id));
                setText(text.replace(`@${user.username}`, ''));
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CommentForm;