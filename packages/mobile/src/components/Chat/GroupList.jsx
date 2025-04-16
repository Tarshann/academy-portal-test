import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';
import { websocketService } from '@academy-portal/common';

const GroupList = ({ groups, selectedGroup, onSelectGroup }) => {
  const handleLeaveGroup = (groupId) => {
    websocketService.leaveGroup(groupId);
  };

  const renderGroup = ({ item: group }) => (
    <TouchableOpacity
      style={[
        styles.groupItem,
        selectedGroup?._id === group._id && styles.selectedGroup,
      ]}
      onPress={() => onSelectGroup(group)}
    >
      <View style={styles.groupContent}>
        <Avatar.Image
          size={40}
          source={require('../../assets/group-icon.png')}
        />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.groupDetails}>
            <Text style={styles.memberCount}>
              {group.members.length} members
            </Text>
            {group.lastMessage && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {group.lastMessage.content}
              </Text>
            )}
          </View>
        </View>
      </View>
      <IconButton
        icon="exit-to-app"
        size={20}
        onPress={() => handleLeaveGroup(group._id)}
      />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={groups}
      renderItem={renderGroup}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedGroup: {
    backgroundColor: '#e3f2fd',
  },
  groupContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfo: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default GroupList; 