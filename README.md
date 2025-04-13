# The Academy Communication Portal

A comprehensive communication platform for The Academy, replacing the previous GroupMe setup with an integrated messaging system featuring team-based groups, topic-based discussions, and direct messages.

## Features

- **User Authentication**
  - Role-based access control (Admin, Coach, Parent, Player)
  - Registration with admin approval
  - Profile management

- **Messaging System**
  - Team-based groups
  - Topic-based discussions
  - Direct messages
  - Media sharing (images and files)
  - Message reactions
  - Read receipts

- **Admin Features**
  - User approval and management
  - Conversation moderation
  - Role assignment

## Technologies Used

- **Frontend**
  - React
  - React Router
  - Axios
  - Socket.IO Client
  - CSS3 with custom styling

- **Backend**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - JWT for authentication
  - Socket.IO for real-time communication
  - Multer for file uploads

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- NPM or Yarn

## Setup and Installation

### Environment Variables

Create a `.env` file in the root directory and add the following variables:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_for_notifications
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@academytn.com
```

### Backend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the client directory:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the React development server:
   ```
   npm start
   ```

## Folder Structure

```
├── client                 # Frontend React application
│   ├── public             # Static files
│   └── src                # React source code
│       ├── components     # React components
│       ├── App.js         # Main App component
│       └── index.js       # Entry point
├── middleware             # Express middleware
├── models                 # Mongoose models
├── routes                 # API routes
├── uploads                # Uploaded files
├── server.js              # Main server file
└── package.json           # Dependencies and scripts
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/user` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### User Management

- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/pending` - Get pending users (admin only)
- `PUT /api/admin/users/:id/approve` - Approve user (admin only)
- `PUT /api/admin/users/:id/reject` - Reject user (admin only)
- `PUT /api/admin/users/:id/update-role` - Update user role (admin only)
- `PUT /api/admin/users/:id/update-status` - Update user status (admin only)

### Profile Management

- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `PUT /api/profile/notification-settings` - Update notification settings
- `PUT /api/profile/password` - Update password
- `POST /api/profile/upload-image` - Upload profile image

### Conversations

- `GET /api/conversations` - Get all conversations for user
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/:id` - Get a specific conversation
- `PUT /api/conversations/:id` - Update a conversation
- `PUT /api/conversations/:id/archive` - Archive/unarchive a conversation
- `POST /api/conversations/:id/participants` - Add participants
- `DELETE /api/conversations/:id/participants/:userId` - Remove a participant

### Messages

- `GET /api/conversations/:id/messages` - Get messages for a conversation
- `POST /api/conversations/:id/messages` - Send a text message
- `POST /api/conversations/:id/messages/media` - Send a media message
- `PUT /api/conversations/:id/messages/:messageId` - Edit a message
- `DELETE /api/conversations/:id/messages/:messageId` - Delete a message
- `POST /api/conversations/:id/messages/:messageId/reaction` - Add a reaction
- `DELETE /api/conversations/:id/messages/:messageId/reaction` - Remove a reaction
- `POST /api/conversations/:id/messages/:messageId/read` - Mark as read

## Socket.IO Events

### Client Events

- `authenticate` - Authenticate socket connection with JWT
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `typing` - Indicate that user is typing
- `stop_typing` - Indicate that user stopped typing

### Server Events

- `new_message` - New message in a conversation
- `message_updated` - Message was edited or reacted to
- `message_deleted` - Message was deleted
- `conversation_updated` - Conversation details updated
- `new_conversation` - User added to a new conversation
- `participant_added` - New participant added to a conversation
- `participant_removed` - Participant removed from a conversation
- `typing` - User is typing in a conversation
- `notification` - New notification for the user

## Deployment

### Heroku Deployment

1. Create a Heroku account and install the Heroku CLI
2. Log in to Heroku:
   ```
   heroku login
   ```

3. Create a new Heroku app:
   ```
   heroku create academy-portal
   ```

4. Add MongoDB addon or set environment variables for external MongoDB:
   ```
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set EMAIL_USER=your_email_user
   heroku config:set EMAIL_PASSWORD=your_email_password
   heroku config:set EMAIL_FROM=noreply@academytn.com
   ```

5. Build the React client:
   ```
   cd client
   npm run build
   ```

6. Push to Heroku:
   ```
   git add .
   git commit -m "Deployment"
   git push heroku master
   ```

### AWS Deployment

1. Set up an EC2 instance with Node.js installed
2. Clone the repository on the EC2 instance
3. Install dependencies and build the React client
4. Use PM2 to manage the Node.js process:
   ```
   npm install -g pm2
   pm2 start server.js
   ```

5. Set up Nginx as a reverse proxy to the Node.js application
6. Configure a domain name with Route 53 (optional)
7. Set up SSL with Certbot (recommended)

## Future Enhancements

- Mobile applications for iOS and Android
- Video and audio messaging
- Message threading
- Polls and surveys
- Calendar integration
- Advanced analytics for team engagement

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m "Description of changes"`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- The Academy staff and students for their feedback and suggestions
- Open source libraries and tools used in this project
