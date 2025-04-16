import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Badge,
  Box,
} from '@mui/material';
import {
  Group as GroupIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { websocketService } from '@academy-portal/common';

const GroupList = ({ groups, selectedGroup, onSelectGroup }) => {
  const handleLeaveGroup = (groupId) => {
    websocketService.leaveGroup(groupId);
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {groups.map((group) => (
        <ListItem
          key={group._id}
          alignItems="flex-start"
          selected={selectedGroup?._id === group._id}
          onClick={() => onSelectGroup(group)}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          secondaryAction={
            <IconButton
              edge="end"
              aria-label="leave group"
              onClick={(e) => {
                e.stopPropagation();
                handleLeaveGroup(group._id);
              }}
            >
              <ExitToAppIcon />
            </IconButton>
          }
        >
          <ListItemAvatar>
            <Badge
              color="primary"
              variant="dot"
              invisible={!group.unreadCount}
              overlap="circular"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
              <Avatar>
                <GroupIcon />
              </Avatar>
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={group.name}
            secondary={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  component="span"
                  variant="body2"
                  color="text.primary"
                  sx={{ mr: 1 }}
                >
                  {group.members.length} members
                </Typography>
                {group.lastMessage && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.lastMessage.content}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default GroupList; 