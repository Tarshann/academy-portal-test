import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile'; // For attachment button
import { websocketService } from '../../../../common/services/websocket'; // Adjust path

const TYPING_TIMER_LENGTH = 1500; // ms

const MessageInput = ({ onSendMessage, disabled = false, conversationId }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false); // Ref to track if currently typing

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (event) => {
    setMessage(event.target.value);

    if (!conversationId || disabled) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If not currently marked as typing, send start event
    if (!isTypingRef.current) {
      websocketService.startTyping(conversationId);
      isTypingRef.current = true;
    }

    // Set a new timeout to send stop event
    typingTimeoutRef.current = setTimeout(() => {
      websocketService.stopTyping(conversationId);
      isTypingRef.current = false;
    }, TYPING_TIMER_LENGTH);
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      
      // Clear typing timeout and send stop event immediately on send
      if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
      }
      if (isTypingRef.current && conversationId) {
          websocketService.stopTyping(conversationId);
          isTypingRef.current = false;
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !disabled) {
      event.preventDefault();
      handleSend();
    }
  };
  
  const handleAttach = () => {
    if (disabled) return;
    alert('Attach file functionality not implemented yet.')
  }

  return (
    <Box 
      component="form" 
      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
      sx={{ display: 'flex', alignItems: 'center', width: '100%' }}
    >
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Type a message..."
        disabled={disabled}
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        multiline
        maxRows={4} // Allow message input to grow slightly
        InputProps={{
          sx: { borderRadius: '20px', pr: 0.5 }, // Rounded corners for text field
          startAdornment: (
            <InputAdornment position="start">
              <IconButton onClick={handleAttach} edge="start" disabled={disabled}>
                <AttachFileIcon />
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton type="submit" color="primary" disabled={!message.trim() || disabled}>
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default MessageInput; 