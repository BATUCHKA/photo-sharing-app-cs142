// complete-migrate-models.js
// Run with: node complete-migrate-models.js

const mongoose = require('mongoose');
const User = require('.//models/User');
const Photo = require('./models/Photo');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');

/**
 * Comprehensive migration script to update database to match model changes
 * This script:
 * 1. Updates all models with new schema fields
 * 2. Normalizes data formats for consistency
 * 3. Preserves existing data while applying model changes
 */
async function migrateAllModels() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/photo-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // 1. Migrate Photo model
    await migratePhotoModel();
    
    // 2. Migrate Comment model
    await migrateCommentModel();
    
    // 3. Migrate User model
    await migrateUserModel();
    
    // 4. Migrate Activity model
    await migrateActivityModel();
    
    console.log('\n✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Migration for Photo model
async function migratePhotoModel() {
  console.log('\n📷 Migrating Photo model...');
  
  // Find all photos
  const photos = await Photo.find();
  console.log(`Found ${photos.length} photos to update`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const photo of photos) {
    try {
      let needsUpdate = false;
      
      // 1. Ensure the likes array exists and is normalized
      if (!photo.likes) {
        console.log(`Photo ${photo._id} has no likes array. Creating empty array.`);
        photo.likes = [];
        needsUpdate = true;
      } else if (!Array.isArray(photo.likes)) {
        console.log(`Photo ${photo._id} has likes that is not an array. Fixing.`);
        photo.likes = [];
        needsUpdate = true;
      } else {
        // Normalize likes array to ensure it only contains valid user IDs
        const normalizedLikes = [];
        
        for (const like of photo.likes) {
          if (!like) continue; // Skip null/undefined
          
          if (typeof like === 'object' && like.user) {
            // If it's an object with user field, extract the ID
            const userId = like.user.toString();
            const userExists = await User.exists({ _id: userId });
            
            if (userExists) {
              normalizedLikes.push(mongoose.Types.ObjectId(userId));
              needsUpdate = true;
            }
          } else if (mongoose.Types.ObjectId.isValid(like)) {
            // If it's a valid ObjectId, check if user exists
            const userExists = await User.exists({ _id: like });
            
            if (userExists) {
              normalizedLikes.push(mongoose.Types.ObjectId(like));
            } else {
              needsUpdate = true; // Need to remove invalid reference
            }
          } else if (typeof like === 'string' && mongoose.Types.ObjectId.isValid(like)) {
            // If it's a string that's a valid ObjectId
            const userExists = await User.exists({ _id: like });
            
            if (userExists) {
              normalizedLikes.push(mongoose.Types.ObjectId(like));
              needsUpdate = true;
            }
          } else {
            needsUpdate = true; // Found invalid like format
          }
        }
        
        // Update likes if needed
        if (needsUpdate) {
          // Remove duplicates
          const uniqueIdsSet = new Set(normalizedLikes.map(id => id.toString()));
          photo.likes = Array.from(uniqueIdsSet).map(id => mongoose.Types.ObjectId(id));
        }
      }
      
      // 2. Ensure comments array exists
      if (!photo.comments) {
        photo.comments = [];
        needsUpdate = true;
      }
      
      // 3. Ensure mentions array exists
      if (!photo.mentions) {
        photo.mentions = [];
        needsUpdate = true;
      }
      
      // 4. Ensure sharedWith array exists
      if (!photo.sharedWith) {
        photo.sharedWith = [];
        needsUpdate = true;
      }
      
      // 5. Ensure dateUploaded exists
      if (!photo.dateUploaded) {
        photo.dateUploaded = new Date();
        needsUpdate = true;
      }
      
      // Save if updates were made
      if (needsUpdate) {
        await photo.save();
        updatedCount++;
        console.log(`✅ Updated photo ${photo._id}`);
      }
    } catch (err) {
      console.error(`❌ Error updating photo ${photo._id}:`, err);
      errorCount++;
    }
  }
  
  console.log(`📷 Photo migration complete: ${updatedCount} updated, ${errorCount} errors`);
}

// Migration for Comment model
async function migrateCommentModel() {
  console.log('\n💬 Migrating Comment model...');
  
  // Find all comments
  const comments = await Comment.find();
  console.log(`Found ${comments.length} comments to update`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const comment of comments) {
    try {
      let needsUpdate = false;
      
      // 1. Ensure user reference exists and is valid
      if (!comment.user) {
        console.log(`Comment ${comment._id} has no user reference. Finding a default user.`);
        const defaultUser = await User.findOne();
        
        if (defaultUser) {
          comment.user = defaultUser._id;
          needsUpdate = true;
        } else {
          console.error(`❌ Cannot update comment ${comment._id} - no users found for default assignment`);
          continue;
        }
      } else {
        // Verify user exists
        const userExists = await User.exists({ _id: comment.user });
        
        if (!userExists) {
          console.log(`Comment ${comment._id} references non-existent user. Finding a default user.`);
          const defaultUser = await User.findOne();
          
          if (defaultUser) {
            comment.user = defaultUser._id;
            needsUpdate = true;
          } else {
            console.error(`❌ Cannot update comment ${comment._id} - no users found for default assignment`);
            continue;
          }
        }
      }
      
      // 2. Ensure photo reference exists and is valid
      if (!comment.photo) {
        console.error(`❌ Comment ${comment._id} has no photo reference. This comment is invalid.`);
        // Delete invalid comment
        await Comment.deleteOne({ _id: comment._id });
        console.log(`Deleted invalid comment ${comment._id}`);
        continue;
      } else {
        // Verify photo exists
        const photoExists = await Photo.exists({ _id: comment.photo });
        
        if (!photoExists) {
          console.error(`❌ Comment ${comment._id} references non-existent photo. This comment is invalid.`);
          // Delete invalid comment
          await Comment.deleteOne({ _id: comment._id });
          console.log(`Deleted invalid comment ${comment._id}`);
          continue;
        }
      }
      
      // 3. Ensure mentions array exists
      if (!comment.mentions) {
        comment.mentions = [];
        needsUpdate = true;
      }
      
      // 4. Ensure dateCreated exists
      if (!comment.dateCreated) {
        comment.dateCreated = new Date();
        needsUpdate = true;
      }
      
      // Save if updates were made
      if (needsUpdate) {
        await comment.save();
        updatedCount++;
        console.log(`✅ Updated comment ${comment._id}`);
      }
    } catch (err) {
      console.error(`❌ Error updating comment ${comment._id}:`, err);
      errorCount++;
    }
  }
  
  console.log(`💬 Comment migration complete: ${updatedCount} updated, ${errorCount} errors`);
}

// Migration for User model
async function migrateUserModel() {
  console.log('\n👤 Migrating User model...');
  
  // Find all users
  const users = await User.find();
  console.log(`Found ${users.length} users to update`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const user of users) {
    try {
      let needsUpdate = false;
      
      // 1. Ensure favorites array exists
      if (!user.favorites) {
        user.favorites = [];
        needsUpdate = true;
      }
      
      // 2. Validate favorites array
      if (Array.isArray(user.favorites)) {
        const validFavorites = [];
        
        for (const favorite of user.favorites) {
          if (mongoose.Types.ObjectId.isValid(favorite)) {
            // Check if photo exists
            const photoExists = await Photo.exists({ _id: favorite });
            
            if (photoExists) {
              validFavorites.push(mongoose.Types.ObjectId(favorite));
            } else {
              needsUpdate = true; // Need to remove invalid reference
            }
          }
        }
        
        if (needsUpdate) {
          user.favorites = validFavorites;
        }
      }
      
      // 3. Ensure lastActivity field exists
      if (user.lastActivity) {
        // Verify activity exists
        const activityExists = await Activity.exists({ _id: user.lastActivity });
        
        if (!activityExists) {
          user.lastActivity = undefined;
          needsUpdate = true;
        }
      }
      
      // 4. Ensure required fields exist
      if (!user.firstName) {
        user.firstName = user.username || 'User';
        needsUpdate = true;
      }
      
      if (!user.lastName) {
        user.lastName = '';
        needsUpdate = true;
      }
      
      if (!user.username) {
        user.username = user.firstName.toLowerCase() + (user.lastName ? user.lastName.toLowerCase() : '');
        needsUpdate = true;
      }
      
      // Save if updates were made
      if (needsUpdate) {
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user ${user._id}`);
      }
    } catch (err) {
      console.error(`❌ Error updating user ${user._id}:`, err);
      errorCount++;
    }
  }
  
  console.log(`👤 User migration complete: ${updatedCount} updated, ${errorCount} errors`);
}

// Migration for Activity model
async function migrateActivityModel() {
  console.log('\n📊 Migrating Activity model...');
  
  // Find all activities
  const activities = await Activity.find();
  console.log(`Found ${activities.length} activities to update`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const activity of activities) {
    try {
      let needsUpdate = false;
      
      // 1. Ensure user reference is valid
      if (!activity.user) {
        console.error(`❌ Activity ${activity._id} has no user reference. This activity is invalid.`);
        // Delete invalid activity
        await Activity.deleteOne({ _id: activity._id });
        console.log(`Deleted invalid activity ${activity._id}`);
        continue;
      } else {
        // Verify user exists
        const userExists = await User.exists({ _id: activity.user });
        
        if (!userExists) {
          console.error(`❌ Activity ${activity._id} references non-existent user. This activity is invalid.`);
          // Delete invalid activity
          await Activity.deleteOne({ _id: activity._id });
          console.log(`Deleted invalid activity ${activity._id}`);
          continue;
        }
      }
      
      // 2. Validate photo reference if it exists
      if (activity.photo) {
        const photoExists = await Photo.exists({ _id: activity.photo });
        
        if (!photoExists) {
          activity.photo = undefined;
          needsUpdate = true;
        }
      }
      
      // 3. Validate comment reference if it exists
      if (activity.comment) {
        const commentExists = await Comment.exists({ _id: activity.comment });
        
        if (!commentExists) {
          activity.comment = undefined;
          needsUpdate = true;
        }
      }
      
      // 4. Ensure date exists
      if (!activity.date) {
        activity.date = new Date();
        needsUpdate = true;
      }
      
      // 5. Ensure type is valid
      const validTypes = ['PHOTO_UPLOAD', 'COMMENT_ADDED', 'USER_REGISTERED', 'USER_LOGIN', 'USER_LOGOUT', 'PHOTO_LIKE'];
      
      if (!activity.type || !validTypes.includes(activity.type)) {
        activity.type = 'USER_REGISTERED'; // Default type
        needsUpdate = true;
      }
      
      // Save if updates were made
      if (needsUpdate) {
        await activity.save();
        updatedCount++;
        console.log(`✅ Updated activity ${activity._id}`);
      }
    } catch (err) {
      console.error(`❌ Error updating activity ${activity._id}:`, err);
      errorCount++;
    }
  }
  
  console.log(`📊 Activity migration complete: ${updatedCount} updated, ${errorCount} errors`);
}

// Run the migration
migrateAllModels().catch(error => {
  console.error('❌ Unhandled migration error:', error);
  process.exit(1);
});