import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Badge,
} from '@mui/material';
import GroupIconPlaceholder from '../../assets/group-icon.svg'; // Import the SVG

// Helper function to format timestamp (simple example)
const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today: Show time
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else {
    // Older: Show date
    return date.toLocaleDateString();
  }
};

// Placeholder data removed, will use props
// const conversations = [ ... ];

// Accept conversations prop
const ConversationList = ({ 
  conversations = [], 
  onSelectConversation,
  selectedConversationId // Pass selected ID to highlight
}) => { 
  
  if (!conversations || conversations.length === 0) {
      return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No conversations yet.</Typography>
          </Box>
      )
  }
  
  return (
    // Keep height: 100% and overflowY: auto for scrolling
    <Box sx={{ width: '100%', bgcolor: 'background.paper', height: '100%', overflowY: 'auto' }}>
      <List disablePadding>
        {conversations.map((conv) => (
          <React.Fragment key={conv.id}>
            <ListItem alignItems="flex-start" disablePadding>
              <ListItemButton 
                onClick={() => onSelectConversation(conv)}
                selected={selectedConversationId === conv.id} // Highlight selected item
              >
                <ListItemAvatar>
                  {/* Use actual avatar or default group icon */}
                  <Avatar alt={conv.name} src={conv.avatar || GroupIconPlaceholder} /> 
                </ListItemAvatar>
                <ListItemText
                  primary={conv.name}
                  primaryTypographyProps={{ noWrap: true, fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal' }} // Bold if unread
                  secondary={
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color={conv.unreadCount > 0 ? 'text.primary' : 'text.secondary'} // Darker text if unread
                      fontWeight={conv.unreadCount > 0 ? 'bold' : 'normal'} // Bold if unread
                      noWrap
                    >
                      {conv.lastMessage || ''} 
                    </Typography>
                  }
                />
                <Box sx={{ ml: 'auto', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', mb: 0.5 }}>
                      {formatTimestamp(conv.timestamp)} {/* Display formatted timestamp */}
                    </Typography>
                    {conv.unreadCount > 0 && (
                        <Badge badgeContent={conv.unreadCount} color="primary" />
                    )}
                </Box>
              </ListItemButton>
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default ConversationList; 