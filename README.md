# Photo Sharing App

A full-stack MERN application for sharing photos with friends. This app allows users to upload photos, comment on them, like them, maintain favorites, and more.

## User Stories Implemented (12+ story points)

1. **Extend user profile detail with usage** (3 points)
   - Shows most recently uploaded photo with date
   - Shows photo with most comments and comment count
   - Clicking photos navigates to user's photo page

2. **@mentions in comments** (6 points)
   - Users can @mention others in photo comments
   - User detail view shows photos where the user is mentioned
   - Mentions are highlighted in comments

3. **Visibility control of photos** (4 points)
   - Users can specify who can see their photos
   - Private photos are only visible to the owner
   - Shared photos are only visible to specified users

4. **Activity feed** (4 points)
   - Activity feed shows 5 most recent activities
   - Each activity entry shows date, time, user, and activity type
   - Supports photo uploads, comments, registrations, logins, and logouts
   - Auto-updates or provides refresh button

## Features

- User authentication (register, login, logout)
- Photo uploads with captions
- Photo comments with @mentions
- Like/unlike photos
- Photo visibility controls
- Activity feed
- User favorites
- Delete functionality (comments, photos, user accounts)
- User profile with activity info
- Sidebar with users and their latest activities

## Tech Stack

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer

## Installation & Setup

### Prerequisites
- Node.js (latest LTS version)
- MongoDB (running locally or accessible instance)

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/photo-sharing-app.git
   cd photo-sharing-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a .env file in the root directory with the following variables:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/photo-app
   JWT_SECRET=your_jwt_secret
   ```

4. Seed the database
   ```bash
   node server/loadDatabase.js
   ```

5. Start the server
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory
   ```bash
   cd client
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the React development server
   ```bash
   npm start
   ```

4. Access the application at http://localhost:3000

## Usage

### Default Users
After seeding the database, you can login with these credentials:
- Username: johndoe, Password: password123
- Username: janesmith, Password: password123
- Username: bobjohnson, Password: password123

## License
MIT