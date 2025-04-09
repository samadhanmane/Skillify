# Enhanced GPT-4 Certificate Verification System

This document explains the enhanced GPT-4 certificate verification system implemented in the Skillify Credentials Hub platform.

## Overview

The enhanced verification system uses GPT-4's advanced language understanding capabilities to improve the accuracy and reliability of certificate verification. This system combines traditional verification methods (text matching, image analysis) with advanced AI analysis to make better verification decisions.

## Key Features

1. **Two-tier Verification**
   - Basic verification using traditional methods
   - Enhanced verification using GPT-4 for uncertain cases

2. **Comprehensive Analysis**
   - Text extraction using OCR
   - Metadata matching
   - Image integrity analysis
   - Credential format validation
   - Issuer database verification
   - Natural language understanding of certificate content

3. **Intelligent Decision Making**
   - Confidence scoring system
   - Detailed reasoning for decisions
   - Red flag identification
   - Adapts to various certificate formats and issuers

## Implementation Details

### Components

- **OCR Text Extraction**: Uses Tesseract.js to extract text from certificate images
- **Basic Verification**: Matches extracted text against claimed metadata
- **GPT-4 Verification**: Analyzes certificates that have medium confidence scores
- **Image Integrity Analysis**: Checks for signs of tampering or editing
- **Issuer Database Verification**: Validates against known issuer formats and APIs

### Verification Flow

1. User uploads certificate and provides metadata
2. System extracts text using OCR
3. Basic verification compares text with metadata
4. If confidence is very high (≥90%) or very low (≤20%), use basic verification result
5. For medium confidence cases, use GPT-4 enhanced verification
6. Check issuer database if requested
7. Return comprehensive verification results

### Confidence Scoring

The confidence score is calculated based on multiple factors:
- Text match percentage
- Image integrity analysis
- Professional formatting detection
- Number of matching metadata items
- Red flags identified
- Issuer database verification result

## API Documentation

### Endpoint

```
POST /api/ml/verify-certificate
```

### Request

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

### Response

```json
{
  "success": true,
  "verification": {
    "extractedText": "Full text extracted from certificate",
    "verificationResult": {
      "confidenceScore": 85,
      "textMatchScore": 75,
      "imageIntegrityScore": 90,
      "aiDecision": "verified",
      "reasoning": ["List of reasons for decision"],
      "redFlags": ["Any concerns identified"],
      "enhancedVerification": true,
      "verificationDetails": {
        "titleFound": true,
        "issuerFound": true,
        "dateFound": true,
        "credentialIDFound": true,
        "credentialURLFound": true,
        "holderNameFound": true,
        "nameMatchConfidence": 95
      }
    },
    "issuerDatabaseResult": {
      "issuerVerified": true,
      "databaseChecked": true,
      "message": "Certificate validated with issuer database"
    },
    "imageIntegrityAnalysis": {
      "integrityScore": 90,
      "metadataConsistent": true,
      "compressionArtifacts": false,
      "pixelPatternConsistent": true
    },
    "aiDecision": "verified",
    "confidenceScore": 85,
    "reasoning": ["List of reasons for verification"],
    "redFlags": [],
    "enhancedVerification": true
  }
}
```

## Testing

A test script is provided in `backend/scripts/test-verification.js` to demonstrate and test the verification system. To use:

1. Create a `test-data` directory in the backend folder
2. Add a sample certificate image named `sample-certificate.jpg`
3. Run `node backend/scripts/test-verification.js`

## Production Setup

For production use, you'll need to:

1. Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

2. Uncomment and implement the actual GPT-4 API call in the `callGptApi` function in `ml.js`

## Future Improvements

- Fine-tuning GPT model specifically for certificate verification
- Adding blockchain-based verification
- Creating a database of known certificate templates
- Implementing real-time feedback for rejected certificates 