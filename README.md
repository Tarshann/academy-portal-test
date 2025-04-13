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
- `PUT /api/
