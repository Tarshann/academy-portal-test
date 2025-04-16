import React, { useRef, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../../context/AuthContext';

const MessageList = ({ messages = [] }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent', pb: 2 }}>
      {messages.map((message) => {
        const senderId = message.sender?._id;
        const isOwnMessage = senderId === user?._id;
        const senderFirstName = message.sender?.firstName || 'User';

        return (
          <ListItem 
            key={message._id || message.id}
            sx={{ 
              display: 'flex', 
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', 
              px: 0,
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '75%' }}>
              {!isOwnMessage && (
                <ListItemAvatar sx={{ minWidth: 'auto', mr: 1, alignSelf: 'flex-end' }}>
                  <Avatar 
                    alt={senderFirstName} 
                    src={message.sender?.profileImage || '../assets/default-avatar.svg'} 
                    sx={{ width: 32, height: 32 }}
                  />
                </ListItemAvatar>
              )}
              <Paper 
                elevation={1}
                sx={{
                  p: '10px 14px',
                  borderRadius: '16px',
                  bgcolor: isOwnMessage ? 'primary.light' : 'background.paper',
                  color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                  borderTopLeftRadius: isOwnMessage ? '16px' : '4px',
                  borderTopRightRadius: isOwnMessage ? '4px' : '16px',
                  position: 'relative',
                }}
              >
                {!isOwnMessage && (
                  <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>
                    {senderFirstName}
                  </Typography>
                )}
                <ListItemText
                  primary={message.content}
                  primaryTypographyProps={{ variant: 'body1', sx: { wordBreak: 'break-word', pb: isOwnMessage ? '14px' : 0 } }}
                  sx={{ m: 0 }}
                />
                {isOwnMessage && (
                    <Box sx={{ position: 'absolute', bottom: 4, right: 8, display: 'flex', alignItems: 'center' }}>
                        {message.status === 'sending' && (
                            <CircularProgress size={12} sx={{ color: 'white' }} />
                        )}
                        {message.status === 'sent' && (
                            <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'white', opacity: 0.8 }} />
                        )}
                    </Box>
                )}
              </Paper>
            </Box>
          </ListItem>
        );
      })}
      <div ref={messagesEndRef} />
    </List>
  );
};

export default MessageList;