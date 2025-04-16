import React, { useState, useEffect } from 'react';
import {
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { websocketService } from '@academy-portal/common';

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    searchUsers(searchQuery);
    return () => {
      searchUsers.cancel();
    };
  }, [searchQuery]);

  const handleCreateGroup = async (userId) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          members: [userId],
        }),
      });

      if (response.ok) {
        const group = await response.json();
        websocketService.joinGroup(group._id);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
      />

      {searchResults.length > 0 && (
        <Paper
          sx={{
            mt: 1,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user._id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="create group"
                    onClick={() => handleCreateGroup(user._id)}
                  >
                    <PersonAddIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.profileImage} alt={user.firstName}>
                    {user.firstName[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {isSearching && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, textAlign: 'center' }}
        >
          Searching...
        </Typography>
      )}
    </Box>
  );
};

export default UserSearch; 