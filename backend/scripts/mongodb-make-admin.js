import 'dotenv/config';
import mongoose from 'mongoose';

// Email of the user you want to make admin
const adminEmail = process.argv[2];

if (!adminEmail) {
  console.error('Please provide an email address as argument');
  console.log('Usage: node mongodb-make-admin.js user@example.com');
  process.exit(1);
}

// MongoDB Connection URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI + '/skillify';
console.log(`Connecting to: ${MONGODB_URI}`);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected...');
    
    try {
      // Direct update using MongoDB
      const result = await mongoose.connection.db.collection('users').updateOne(
        { email: adminEmail },
        { $set: { role: 'admin' } }
      );
      
      if (result.matchedCount === 0) {
        console.error(`User with email ${adminEmail} not found`);
      } else if (result.modifiedCount === 0) {
        console.log(`User ${adminEmail} is already an admin`);
      } else {
        console.log(`✅ User ${adminEmail} is now an admin`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 