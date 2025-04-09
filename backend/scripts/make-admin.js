import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/mongodb.js';

// Email of the user you want to make admin
const adminEmail = process.argv[2];

if (!adminEmail) {
  console.error('Please provide an email address as argument');
  console.log('Usage: node make-admin.js user@example.com');
  process.exit(1);
}

// Connect to the database
await connectDB();

try {
  // Find the user by email
  const user = await User.findOne({ email: adminEmail });
  
  if (!user) {
    console.error(`User with email ${adminEmail} not found`);
    process.exit(1);
  }
  
  // Check if user is already an admin
  if (user.role === 'admin') {
    console.log(`User ${adminEmail} is already an admin`);
    process.exit(0);
  }
  
  // Update user to be an admin
  user.role = 'admin';
  await user.save();
  
  console.log(`✅ User ${adminEmail} is now an admin`);
  
} catch (error) {
  console.error('Error:', error);
} finally {
  // Close the database connection
  mongoose.connection.close();
}