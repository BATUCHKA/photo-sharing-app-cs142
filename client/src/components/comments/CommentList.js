// client/src/components/comments/CommentList.js
import React from 'react';
import { Link } from 'react-router-dom';

// Material UI
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';

const CommentList = ({ comments, photoId, currentUser, onDeleteComment }) => {
  if (!comments || comments.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No comments yet.
        </Typography>
      </Box>
    );
  }
  
  // Parse @mentions in comment text
  const renderCommentText = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <Typography
            component="span"
            key={index}
            color="primary"
            fontWeight="bold"
          >
            {part}
          </Typography>
        );
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };
  
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {comments.map((comment, index) => (
        <React.Fragment key={comment._id || index}>
          <ListItem
            alignItems="flex-start"
            secondaryAction={
              (comment.user._id === currentUser?._id) && (
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => onDeleteComment(comment._id, photoId)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemAvatar>
              <Avatar 
                component={Link} 
                to={`/users/${comment.user._id}`}
              >
                {comment.user.firstName[0]}{comment.user.lastName[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Link 
                  to={`/users/${comment.user._id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="body2"
                    color="text.primary"
                    fontWeight="bold"
                  >
                    {comment.user.firstName} {comment.user.lastName}
                  </Typography>
                </Link>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    sx={{ display: 'inline', wordBreak: 'break-word' }}
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {renderCommentText(comment.text)}
                  </Typography>
                  <Typography
                    component="div"
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {new Date(comment.dateCreated).toLocaleString()}
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          {index < comments.length - 1 && (
            <Divider variant="inset" component="li" />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

export default CommentList;