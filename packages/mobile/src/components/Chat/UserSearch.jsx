import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Avatar, Text } from 'react-native-paper';
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

  const renderUser = ({ item: user }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleCreateGroup(user._id)}
    >
      <Avatar.Image
        size={40}
        source={
          user.profileImage
            ? { uri: user.profileImage }
            : require('../../assets/default-avatar.png')
        }
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search users..."
        placeholderTextColor="#666"
      />

      {isSearching ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.noResults}>No users found</Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
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
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default UserSearch; 