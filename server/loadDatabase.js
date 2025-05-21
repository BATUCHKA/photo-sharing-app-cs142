// server/loadDatabase.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Photo = require('./models/Photo');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/photo-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample data
const users = [
  {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    password: 'password123',
    location: 'San Francisco, CA',
    description: 'Photography enthusiast',
    occupation: 'Software Engineer'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'janesmith',
    password: 'password123',
    location: 'New York, NY',
    description: 'Travel lover',
    occupation: 'Graphic Designer'
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    username: 'bobjohnson',
    password: 'password123',
    location: 'Chicago, IL',
    description: 'Food blogger',
    occupation: 'Chef'
  }
];

const photos = [
  {
    file: '/uploads/sample1.jpg',
    caption: 'Beautiful sunset at the beach',
  },
  {
    file: '/uploads/sample2.jpg',
    caption: 'Downtown skyline',
  },
  {
    file: '/uploads/sample3.jpg',
    caption: 'Mountain hiking trip',
  },
  {
    file: '/uploads/sample4.jpg',
    caption: 'Family picnic',
  },
  {
    file: '/uploads/sample5.jpg',
    caption: 'Concert night',
  },
  {
    file: '/uploads/sample6.jpg',
    caption: 'My new puppy',
  }
];

const comments = [
  'Great photo!',
  'Love the colors!',
  'Where was this taken?',
  'Beautiful shot!',
  'Awesome!',
  'This is incredible!',
  'Nice composition!',
  'What camera did you use?',
  'Perfect timing!',
  'Wow, stunning!',
  'I wish I was there!',
  'This made my day!',
];

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Copy sample images to uploads directory
const sampleImagesDir = path.join(__dirname, 'sample-images');

// Function to copy sample images
const copySampleImages = () => {
  if (fs.existsSync(sampleImagesDir)) {
    const imageFiles = fs.readdirSync(sampleImagesDir);

    imageFiles.forEach((file, index) => {
      const sourcePath = path.join(sampleImagesDir, file);
      const targetPath = path.join(uploadsDir, `sample${index + 1}${path.extname(file)}`);

      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${file} to ${targetPath}`);
    });
  } else {
    console.warn('Sample images directory not found. Skipping image copy.');
  }
};

// Clear existing data and seed database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Photo.deleteMany({});
    await Comment.deleteMany({});
    await Activity.deleteMany({});

    console.log('Database cleared');

    // Create users - IMPORTANT: Use manual hashing to avoid issues with pre-save hook
    const createdUsers = [];

    for (const userData of users) {
      // Generate a salt and hash the password directly
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create a new user document directly without relying on the model's pre-save hook
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      // Save the user to the database
      await user.save();
      createdUsers.push(user);

      console.log(`Created user: ${user.username} with password: ${userData.password} (hashed as: ${hashedPassword.substring(0, 10)}...)`);

      // Create activity for user registration
      const activity = new Activity({
        user: user._id,
        type: 'USER_REGISTERED',
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000))
      });

      await activity.save();

      // Update user's last activity
      user.lastActivity = activity._id;
      await user.save();
    }

    console.log(`${createdUsers.length} users created`);

    // Create photos (distribute among users)
    const createdPhotos = [];

    for (let i = 0; i < photos.length; i++) {
      const user = createdUsers[i % createdUsers.length];

      const photo = new Photo({
        ...photos[i],
        user: user._id,
        dateUploaded: new Date(Date.now() - Math.floor(Math.random() * 10000000))
      });

      await photo.save();
      createdPhotos.push(photo);

      // Create activity for photo upload
      const activity = new Activity({
        user: user._id,
        type: 'PHOTO_UPLOAD',
        photo: photo._id,
        date: photo.dateUploaded
      });

      await activity.save();

      // Update user's last activity
      user.lastActivity = activity._id;
      await user.save();
    }

    console.log(`${createdPhotos.length} photos created`);

    // Create comments (2-3 per photo, distributed among users)
    let commentCount = 0;

    for (const photo of createdPhotos) {
      const numComments = 2 + Math.floor(Math.random() * 2); // 2-3 comments

      for (let i = 0; i < numComments; i++) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const randomComment = comments[Math.floor(Math.random() * comments.length)];

        // Don't let users comment on their own photos
        if (randomUser._id.toString() === photo.user.toString()) {
          continue;
        }

        const comment = new Comment({
          photo: photo._id,
          user: randomUser._id,
          text: randomComment,
          dateCreated: new Date(Date.now() - Math.floor(Math.random() * 5000000))
        });

        await comment.save();
        commentCount++;

        // Add comment to photo
        photo.comments.push(comment._id);
        await photo.save();

        // Create activity for comment
        const activity = new Activity({
          user: randomUser._id,
          type: 'COMMENT_ADDED',
          photo: photo._id,
          comment: comment._id,
          date: comment.dateCreated
        });

        await activity.save();

        // Update user's last activity
        randomUser.lastActivity = activity._id;
        await randomUser.save();
      }
    }

    console.log(`${commentCount} comments created`);
    console.log('Database seeded successfully');

    // Verify users and passwords
    console.log('\nVerifying user login credentials:');
    for (const userData of users) {
      const user = await User.findOne({ username: userData.username });
      if (user) {
        const isMatch = await bcrypt.compare(userData.password, user.password);
        console.log(`User ${userData.username} verification: ${isMatch ? 'PASSED' : 'FAILED'}`);
      } else {
        console.log(`User ${userData.username} not found in database!`);
      }
    }

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the seeding
copySampleImages();
seedDatabase();