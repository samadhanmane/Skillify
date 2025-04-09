import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/mongodb.js';

// Email of the user to make admin
const adminEmail = process.argv[2];

if (!adminEmail) {
  console.error('Please provide an email address as argument');
  console.log('Usage: node set-admin-flag.js user@example.com');
  process.exit(1);
}

// Connect to MongoDB
const main = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Find the user
    const userCollection = mongoose.connection.db.collection('users');
    const user = await userCollection.findOne({ email: adminEmail });
    
    if (!user) {
      console.error(`❌ User with email ${adminEmail} not found`);
      return;
    }
    
    console.log('User found:');
    console.log('- ID:', user._id);
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Current isAdmin:', user.isAdmin);
    
    // Update isAdmin flag
    const result = await userCollection.updateOne(
      { _id: user._id },
      { $set: { isAdmin: true } }
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ User updated! isAdmin set to true');
    } else if (user.isAdmin === true) {
      console.log('ℹ️ User is already an admin');
    } else {
      console.log('❌ Failed to update user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
};

main(); 