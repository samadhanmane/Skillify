import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import connectDB from '../config/mongodb.js';
import User from '../models/User.js';
import ApiKey from '../models/ApiKey.js';
import Content from '../models/Content.js';
import SystemLog from '../models/SystemLog.js';
import SystemSettings from '../models/SystemSettings.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read mock data file
const readMockData = () => {
  try {
    const filePath = path.join(__dirname, '..', 'mockAdminData.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading mock data:', error);
    process.exit(1);
  }
};

// Function to import API keys
const importApiKeys = async (apiKeys, adminUser) => {
  console.log('Importing API keys...');
  
  // Delete existing API keys (optional)
  await ApiKey.deleteMany({});
  
  // Add owner to each key
  const keysWithOwner = apiKeys.map(key => ({
    ...key,
    owner: adminUser._id
  }));
  
  // Insert API keys
  await ApiKey.insertMany(keysWithOwner);
  console.log(`✅ Imported ${apiKeys.length} API keys`);
};

// Function to import content
const importContent = async (content, adminUser) => {
  console.log('Importing content...');
  
  // Delete existing content (optional)
  await Content.deleteMany({});
  
  // Process pages
  const pages = content.pages.map(page => ({
    ...page,
    contentType: 'page',
    author: adminUser._id
  }));
  
  // Process FAQs
  const faqs = content.faqs.map(faq => ({
    ...faq,
    contentType: 'faq',
    author: adminUser._id
  }));
  
  // Process announcements
  const announcements = content.announcements.map(announcement => ({
    ...announcement,
    contentType: 'announcement',
    author: adminUser._id
  }));
  
  // Combine all content and insert
  const allContent = [...pages, ...faqs, ...announcements];
  await Content.insertMany(allContent);
  console.log(`✅ Imported ${allContent.length} content items`);
};

// Function to import system settings
const importSystemSettings = async (settings, adminUser) => {
  console.log('Importing system settings...');
  
  // Delete existing settings (optional)
  await SystemSettings.deleteMany({});
  
  // Add lastModifiedBy to each setting
  const settingsWithUser = settings.map(setting => ({
    ...setting,
    lastModifiedBy: adminUser._id
  }));
  
  // Insert settings
  await SystemSettings.insertMany(settingsWithUser);
  console.log(`✅ Imported ${settings.length} system settings`);
};

// Function to import system logs
const importSystemLogs = async (logs, adminUser) => {
  console.log('Importing system logs...');
  
  // Delete existing logs (optional)
  await SystemLog.deleteMany({});
  
  // Add userId to each log if it has details.userId
  const logsWithUser = logs.map(log => {
    const newLog = { ...log };
    if (newLog.details && newLog.details.userId) {
      newLog.userId = adminUser._id;
    }
    return newLog;
  });
  
  // Insert logs
  await SystemLog.insertMany(logsWithUser);
  console.log(`✅ Imported ${logs.length} system logs`);
};

// Main function to import all data
const importAllData = async () => {
  console.log('Starting import of admin data...');
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Read mock data
    const mockData = readMockData();
    
    // Find or create an admin user
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Creating one...');
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@skillify.com',
        password: 'admin@1234',
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Created admin user');
    }
    
    // Import each data type
    await importApiKeys(mockData.apiKeys, adminUser);
    await importContent(mockData.content, adminUser);
    await importSystemSettings(mockData.systemSettings, adminUser);
    await importSystemLogs(mockData.systemLogs, adminUser);
    
    console.log('✅ All data imported successfully!');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
  }
};

// Run the import
importAllData(); 