import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

// Function to generate typing indicator text
const getTypingIndicatorText = (users) => {
  if (!users || users.length === 0) {
    return '';
  }
  if (users.length === 1) {
    return `${users[0].firstName || 'Someone'} is typing...`;
  }
  if (users.length === 2) {
    return `${users[0].firstName || 'User1'} and ${users[1].firstName || 'User2'} are typing...`;
  }
  return 'Several people are typing...';
};

const ChatWindow = ({ conversation, messages, onSendMessage, isLoading, error, typingUsers = [] }) => {
  if (!conversation) {
    return (
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          p: 2 
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a conversation to start chatting
        </Typography>
      </Box>
    );
  }

  const typingText = getTypingIndicatorText(typingUsers);

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">{conversation.name}</Typography>
        {/* Add other header info like participants, status etc. */}
      </Box>
      
      {/* Message List Area - Conditionally render based on loading/error */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f9f9f9' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
             <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
          </Box>
        ) : (
          <MessageList messages={messages} /> 
        )}
      </Box>
      
      {/* Typing Indicator Area */}
      <Box sx={{ height: '24px', px: 2, pt: 0.5, visibility: typingText ? 'visible' : 'hidden' }}> {/* Reserve space */} 
        <Typography variant="caption" color="text.secondary">
          {typingText || '\u00A0'} {/* Use non-breaking space to maintain height */} 
        </Typography>
      </Box>

      <Divider />

      {/* Message Input Area - Disable input if conversation is loading/error? Optional */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
         <MessageInput 
           onSendMessage={onSendMessage} 
           disabled={isLoading || !!error} // Optional: disable input on load/error
           conversationId={conversation.id} // Pass conversationId to MessageInput
         /> 
      </Box>
    </Box>
  );
};

export default ChatWindow; 