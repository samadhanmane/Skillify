# Skillify Credentials Hub - Backend Documentation

## Table of Contents
1. [Admin System](#admin-system)
2. [Gamification System](#gamification-system)
3. [Certificate Verification](#certificate-verification)
4. [Testing Guide](#testing-guide)

## Admin System

### Overview
The admin system uses MongoDB to store:
- API Keys
- Content (pages, FAQs, announcements)
- System Settings
- System Logs

### Setup Instructions
1. Install MongoDB:
   - [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud-hosted option)

2. Configure `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
   ```

3. Initialize Database:
   ```bash
   npm run setup-mock-data
   ```

4. Default Admin Credentials:
   - Email: admin@skillify.com
   - Password: admin@1234

### MongoDB Schema
- `users` - User accounts including admin users
- `apikeys` - API keys for external integrations
- `contents` - Pages, FAQs and announcements
- `systemlogs` - System activity logs
- `systemsettings` - Configuration settings
- `certificates` - User certificates
- `skills` - Available skills

## Gamification System

### Features
1. Points System
2. Levels
3. Badges
4. Learning Streaks
5. Achievements

### Points System
| Activity | Points |
|----------|---------|
| Daily login | 5 |
| Adding certificate | 20 |
| Verifying certificate | 30 |
| Adding skill | 15 |
| Completing profile | 25 |
| 7-day streak | 50 |
| 30-day streak | 200 |
| Earning badge | 50 |

### Level System
| Level | Points | Title |
|-------|---------|-------|
| 1 | 0 | Beginner |
| 2 | 100 | Explorer |
| 5 | 400 | Achiever |
| 10 | 900 | Expert |
| 20 | 1900 | Master |
| 30 | 2900 | Legend |

### Badges
1. Skill Master (10+ skills)
2. Certificate Champion (10+ certificates)
3. Verification Guru (5+ verified certificates)
4. Consistency Champion (30-day streak)
5. Profile Completer (complete profile)
6. Perfect Verification (100% score)

## Certificate Verification

### Features
1. Two-tier Verification
   - Basic verification
   - GPT-4 enhanced verification
2. Comprehensive Analysis
   - OCR text extraction
   - Metadata matching
   - Image integrity analysis
   - Credential validation
   - Issuer verification
3. Intelligent Decision Making
   - Confidence scoring
   - Detailed reasoning
   - Red flag identification

### API Endpoint
```
POST /api/ml/verify-certificate
```

### Request Format
```json
{
  "imageUrl": "base64 or URL of certificate image",
  "title": "Certificate title",
  "issuer": "Issuing organization",
  "issueDate": "Date of issuance",
  "credentialID": "Unique credential identifier",
  "credentialURL": "URL to verify certificate",
  "holderName": "Name of certificate holder",
  "checkIssuerDatabase": true
}
```

## Testing Guide

### Setup Test Environment
1. Create test-data directory:
   ```bash
   mkdir -p backend/test-data
   ```

2. Add test certificates:
   - `sample-certificate.jpg` - Legitimate certificate
   - `modified-certificate.jpg` - Modified certificate

### Running Tests
1. Web Interface:
   - Start app: `npm run dev`
   - Navigate to `/verify`
   - Upload test certificate
   - Fill in details
   - Click "Verify Certificate"

2. Test Script:
   ```bash
   cd backend
   node scripts/test-verification.js
   ```

### Verification Results
- Decision: verified/rejected/needs_review
- Confidence Score
- Reasoning
- Red Flags
- Verification Details

## Troubleshooting

### Admin Issues
1. Dashboard Shows Zero Counts
   - Check MongoDB connection
   - Verify `.env` configuration
   - Run setup script
   - Check server logs

2. API Errors
   - Verify server port (4000)
   - Check admin authentication
   - Review backend logs

### Verification Issues
1. OCR Failures
   - Use clearer images
   - Improve resolution
   - Ensure good lighting

2. Verification Accuracy
   - Match certificate details exactly
   - Provide credential URL when available
   - Check issuer database status 