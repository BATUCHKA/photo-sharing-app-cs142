// client/src/components/comments/CommentForm.js
import React, { useState, useEffect, useRef } from 'react';
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
import Paper from '@mui/material/Paper';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';

// Icons
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';

const CommentForm = ({ photoId, onAddComment, showAlert }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  
  // Mention dropdown state
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);
  const textFieldRef = useRef(null);
  
  // Fetch all users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError(null);
        const res = await axios.get('/users/list/mentions');
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
  
  // Handle text change and @mention detection
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Get cursor position
    const cursorPos = e.target.selectionStart;
    
    // Find @ symbol before cursor
    const textBeforeCursor = newText.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      // Get text between @ and cursor
      const searchText = textBeforeCursor.substring(atIndex + 1);
      
      // Only search if there's no space in the searchText
      if (!searchText.includes(' ') && searchText.length > 0) {
        setMentionSearch(searchText);
        setCursorPosition(cursorPos);
        searchUsers(searchText);
        setShowMentionDropdown(true);
      } else if (searchText.length === 0) {
        // Show all users if just @ is typed
        setMentionResults(users);
        setMentionSearch('');
        setCursorPosition(cursorPos);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };
  
  // Search users for @mention
  const searchUsers = (query) => {
    if (!query) {
      setMentionResults(users);
      return;
    }
    
    const filteredUsers = users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        fullName.includes(query.toLowerCase())
      );
    });
    
    setMentionResults(filteredUsers);
  };
  
  // Handle user mention selection
  const handleUserMention = (user) => {
    if (!user) return;
    
    // Find the @ symbol position before cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      // Replace @searchText with @username
      const beforeAt = text.substring(0, atIndex);
      const afterCursor = text.substring(cursorPosition);
      const newText = `${beforeAt}@${user.username} ${afterCursor}`;
      setText(newText);
      
      // Add user to mentioned users if not already there
      if (!mentionedUsers.some(u => u._id === user._id)) {
        setMentionedUsers([...mentionedUsers, user]);
      }
      
      // Focus back on textarea
      if (textFieldRef.current) {
        setTimeout(() => {
          textFieldRef.current.focus();
        }, 10);
      }
    }
    
    setShowMentionDropdown(false);
  };
  
  // Handle removing a mention chip
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
  
  // Handle form submission
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
  
  // Render @mention dropdown
  const renderMentionDropdown = () => {
    if (!showMentionDropdown) return null;
    
    return (
      <Popper
        open={showMentionDropdown}
        anchorEl={textFieldRef.current}
        placement="bottom-start"
        style={{ zIndex: 1500 }}
      >
        <ClickAwayListener onClickAway={() => setShowMentionDropdown(false)}>
          <Paper elevation={3} sx={{ maxWidth: 300, maxHeight: 300, overflow: 'auto' }}>
            {mentionResults.length === 0 ? (
              <ListItem>
                <ListItemText primary="No users found" />
              </ListItem>
            ) : (
              mentionResults.map((user, index) => (
                <React.Fragment key={user._id}>
                  <ListItem 
                    button 
                    onClick={() => handleUserMention(user)}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'action.hover' 
                      } 
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={`@${user.username}`}
                    />
                  </ListItem>
                  {index < mentionResults.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    );
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
        placeholder="Type your comment here. Use @ to mention users."
        inputRef={textFieldRef}
        sx={{ position: 'relative' }}
      />
      
      {renderMentionDropdown()}
      
      {mentionedUsers.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 1 }}>
          <Typography variant="caption" sx={{ mr: 1, alignSelf: 'center' }}>
            Mentions:
          </Typography>
          {mentionedUsers.map((user) => (
            <Chip
              key={user._id}
              label={`@${user.username}`}
              size="small"
              onDelete={() => handleRemoveMention(user._id)}
              color="primary"
              variant="outlined"
              icon={<AlternateEmailIcon />}
            />
          ))}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          disabled={loading || !text.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Post'}
        </Button>
      </Box>
    </Box>
  );
};

export default CommentForm;