const fetch = require('node-fetch');

class PushNotificationService {
  constructor() {
    this.serverKey = process.env.FIREBASE_SERVER_KEY;
  }

  async sendPushNotification(token, notification) {
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.serverKey}`
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: notification.title,
            body: notification.body,
            sound: 'default',
            badge: 1
          },
          data: notification.data || {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  async sendToMultipleDevices(tokens, notification) {
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.serverKey}`
        },
        body: JSON.stringify({
          registration_ids: tokens,
          notification: {
            title: notification.title,
            body: notification.body,
            sound: 'default',
            badge: 1
          },
          data: notification.data || {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send push notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  }

  createMessageNotification(sender, message) {
    return {
      title: `New message from ${sender.firstName} ${sender.lastName}`,
      body: message.content,
      data: {
        type: 'message',
        messageId: message._id.toString(),
        groupId: message.group.toString(),
        senderId: sender._id.toString()
      }
    };
  }

  createGroupNotification(type, group, user) {
    const notifications = {
      'group_join': {
        title: 'New Group Member',
        body: `${user.firstName} ${user.lastName} joined ${group.name}`
      },
      'group_leave': {
        title: 'Member Left Group',
        body: `${user.firstName} ${user.lastName} left ${group.name}`
      }
    };

    return {
      ...notifications[type],
      data: {
        type,
        groupId: group._id.toString(),
        userId: user._id.toString()
      }
    };
  }
}

module.exports = new PushNotificationService(); 