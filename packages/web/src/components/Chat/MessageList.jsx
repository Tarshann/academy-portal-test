import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { format } from 'date-fns';

const MessageList = ({ messages, typingUsers, messageEndRef }) => {
  const renderMessage = (message) => {
    const isOwnMessage = message.sender._id === user._id;

    return (
      <Box
        key={message._id}
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            maxWidth: '70%',
          }}
        >
          <Avatar
            src={message.sender.profileImage}
            alt={message.sender.firstName}
            sx={{ mx: 1 }}
          />
          <Box>
            <Paper
              sx={{
                p: 2,
                bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                color: isOwnMessage ? 'white' : 'text.primary',
                borderRadius: 2,
              }}
            >
              <Typography variant="body1">{message.content}</Typography>
              {message.attachments?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {message.attachments.map((attachment) => (
                    <Box
                      key={attachment._id}
                      component="a"
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'block',
                        color: isOwnMessage ? 'white' : 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {attachment.name}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                display: 'block',
                textAlign: isOwnMessage ? 'right' : 'left',
              }}
            >
              {format(new Date(message.createdAt), 'HH:mm')}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.map(renderMessage)}
      {typingUsers.size > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {Array.from(typingUsers).length === 1
              ? 'Someone is typing...'
              : `${Array.from(typingUsers).length} people are typing...`}
          </Typography>
        </Box>
      )}
      <div ref={messageEndRef} />
    </Box>
  );
};

export default MessageList; 