# Getting Started with MongoDB Admin Integration

## Overview

This project now uses MongoDB to store all admin functionality data including:
- API Keys
- Content (pages, FAQs, announcements)  
- System Settings
- System Logs

All admin dashboard stats and data come directly from the MongoDB database. No hardcoded mock data is used.

## Setup Instructions

### 1. Install MongoDB

If you haven't already, install MongoDB:
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud-hosted option)

### 2. Configure Connection String

Make sure your `.env` file has the correct MongoDB connection string:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
```

### 3. Initialize the Database

Run the setup script to populate MongoDB with initial data:

```bash
cd backend
npm run setup-mock-data
```

This will:
- Create an admin user if one doesn't exist
- Import API keys, content, system settings and logs
- Create test user accounts

### 4. Start the Backend Server

```bash
npm run dev
```

### 5. Login as Admin

Use the default admin credentials:
- Email: admin@skillify.com
- Password: admin@1234

## Troubleshooting

### Dashboard Shows Zero Counts

If your dashboard shows zeros for all stats:
1. Make sure MongoDB is running
2. Verify your connection string in `.env`
3. Run the setup script: `npm run setup-mock-data`
4. Check the server logs for connection errors

### API Errors

If you see API errors in the console:
1. Verify that the server is running on the expected port (4000)
2. Check that you're authenticated as an admin user
3. Look at the backend console for detailed error messages

## MongoDB Schema

The project uses the following MongoDB collections:
- `users` - User accounts including admin users
- `apikeys` - API keys for external integrations
- `contents` - Pages, FAQs and announcements
- `systemlogs` - System activity logs
- `systemsettings` - Configuration settings
- `certificates` - User certificates (referenced by stats)
- `skills` - Available skills (referenced by stats)

## Admin API Endpoints

All data is fetched from MongoDB through these API endpoints:

- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/api-keys` - API key management 
- `GET /api/admin/content` - Content management
- `GET /api/admin/logs` - System logs
- `GET /api/admin/settings` - System settings

Authentication is required for all admin endpoints. 