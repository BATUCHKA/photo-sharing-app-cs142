
import React from 'react';
import { Link } from 'react-router-dom';


import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';


import DeleteIcon from '@mui/icons-material/Delete';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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


  const renderCommentText = (text, mentions = []) => {
    if (!text) return '';

    const parts = text.split(/(@\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);


        const mentionedUser = mentions && Array.isArray(mentions) ?
          mentions.find(user => user && user.username === username) : null;

        if (mentionedUser) {
          return (
            <Tooltip
              key={index}
              title={`${mentionedUser.firstName} ${mentionedUser.lastName}`}
              arrow
            >
              <Typography
                component={Link}
                to={`/users/${mentionedUser._id}`}
                key={index}
                color="primary"
                fontWeight="bold"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {part}
              </Typography>
            </Tooltip>
          );
        } else {
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
        }
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };


  const validComments = comments.filter(comment => comment && comment.user);


  if (validComments.length < comments.length) {
    console.warn('Some comments have missing user data and were filtered out');
  }

  return (
    <Box>
      {validComments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No valid comments to display.
        </Typography>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {validComments.map((comment, index) => {

            if (!comment || !comment.user) {
              return null;
            }

            return (
              <React.Fragment key={comment._id || `comment-${index}`}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    (currentUser && comment.user._id === currentUser._id) && (
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
                      sx={{ bgcolor: 'primary.main' }}
                    >
                      {comment.user.firstName && comment.user.lastName ?
                        `${comment.user.firstName[0]}${comment.user.lastName[0]}` : 'U'}
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
                          {renderCommentText(comment.text, comment.mentions)}
                        </Typography>

                        {/* Mentioned users display */}
                        {comment.mentions && Array.isArray(comment.mentions) && comment.mentions.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {comment.mentions.map(user => {
                              if (!user) return null;
                              return (
                                <Chip
                                  key={user._id}
                                  icon={<AlternateEmailIcon />}
                                  label={`${user.firstName} ${user.lastName}`}
                                  component={Link}
                                  to={`/users/${user._id}`}
                                  size="small"
                                  clickable
                                  color="primary"
                                  variant="outlined"
                                  sx={{
                                    textDecoration: 'none',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              );
                            })}
                          </Box>
                        )}

                        <Typography
                          component="div"
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {comment.dateCreated ? new Date(comment.dateCreated).toLocaleString() : 'Unknown date'}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < validComments.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default CommentList;