// server/diagnose.js
const express = require('express');
const app = express();
const port = 3001;

console.log('Starting diagnostic server...');

// Test importing each route file individually
try {
  console.log('Testing userRoutes...');
  const userRoutes = require('./routes/users');
  console.log('✅ userRoutes imported successfully');
  
  console.log('Testing photoRoutes...');
  const photoRoutes = require('./routes/photos');
  console.log('✅ photoRoutes imported successfully');
  
  console.log('Testing commentRoutes...');
  const commentRoutes = require('./routes/comments');
  console.log('✅ commentRoutes imported successfully');
  
  console.log('Testing authRoutes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ authRoutes imported successfully');
  
  console.log('Testing activityRoutes...');
  const activityRoutes = require('./routes/activities');
  console.log('✅ activityRoutes imported successfully');
  
  // If we got here, all routes imported successfully
  console.log('All route files imported successfully!');
  
  // Now try mounting each route
  console.log('Mounting routes individually...');
  
  // Create a fresh app for each test to isolate issues
  const testUserRoutes = () => {
    const testApp = express();
    console.log('Mounting userRoutes...');
    testApp.use('/api/users', userRoutes);
    console.log('✅ userRoutes mounted successfully');
  };
  
  const testPhotoRoutes = () => {
    const testApp = express();
    console.log('Mounting photoRoutes...');
    testApp.use('/api/photos', photoRoutes);
    console.log('✅ photoRoutes mounted successfully');
  };
  
  const testCommentRoutes = () => {
    const testApp = express();
    console.log('Mounting commentRoutes...');
    testApp.use('/api/comments', commentRoutes);
    console.log('✅ commentRoutes mounted successfully');
  };
  
  const testAuthRoutes = () => {
    const testApp = express();
    console.log('Mounting authRoutes...');
    testApp.use('/api/auth', authRoutes);
    console.log('✅ authRoutes mounted successfully');
  };
  
  const testActivityRoutes = () => {
    const testApp = express();
    console.log('Mounting activityRoutes...');
    testApp.use('/api/activities', activityRoutes);
    console.log('✅ activityRoutes mounted successfully');
  };
  
  // Run the tests in sequence
  testUserRoutes();
  testPhotoRoutes();
  testCommentRoutes();
  testAuthRoutes();
  testActivityRoutes();
  
  console.log('All routes mounted successfully!');
  
} catch (error) {
  console.error('❌ Error occurred:', error);
}

// Start a simple server
app.get('/', (req, res) => {
  res.send('Diagnostic server is running');
});

app.listen(port, () => {
  console.log(`Diagnostic server running at http://localhost:${port}`);
});