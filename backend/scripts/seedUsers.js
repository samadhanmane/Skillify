import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/mongodb.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const seedUsers = async () => {
  console.log('Starting seeding test users...');
  
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'user@example.com' });
    if (existingUser) {
      console.log('Test user already exists, skipping creation');
    } else {
      // Create a regular test user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const testUser = new User({
        name: 'Test User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        status: 'active',
        bio: 'This is a test user account',
        location: 'Test City',
        profileImage: 'https://i.pravatar.cc/300'
      });
      
      await testUser.save();
      console.log('✅ Test user created');
    }
    
    // Create some additional test users
    const additionalUsers = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        role: 'user',
        status: 'inactive'
      }
    ];
    
    for (const userData of additionalUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        
        await user.save();
        console.log(`✅ Created user: ${userData.name}`);
      } else {
        console.log(`User ${userData.email} already exists, skipping`);
      }
    }
    
    console.log('✅ All test users seeded successfully');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

// Run the seeder
seedUsers(); 