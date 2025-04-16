import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PushNotificationService {
  constructor() {
    this.PUSH_TOKEN_KEY = '@push_token';
  }

  async init() {
    try {
      await this.requestPermissions();
      await this.configurePushNotifications();
      await this.registerForPushNotifications();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for push notifications');
    }
  }

  configurePushNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async registerForPushNotifications() {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await this.savePushToken(token.data);
      await this.sendPushTokenToServer(token.data);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  async savePushToken(token) {
    try {
      await AsyncStorage.setItem(this.PUSH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async sendPushTokenToServer(token) {
    try {
      const response = await fetch('/api/users/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your authentication headers here
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to send push token to server');
      }
    } catch (error) {
      console.error('Error sending push token to server:', error);
    }
  }

  async getPushToken() {
    try {
      return await AsyncStorage.getItem(this.PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Add notification listeners
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Remove notification listeners
  removeNotificationSubscription(subscription) {
    subscription.remove();
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService; 