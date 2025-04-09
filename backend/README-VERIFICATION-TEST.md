# Certificate Verification Testing Guide

This guide will help you test the enhanced certificate verification system with GPT-4 integration.

## Setting Up Test Certificates

1. **Create a test-data directory** (if it doesn't already exist):
   ```
   mkdir -p backend/test-data
   ```

2. **Obtain sample certificates** for testing. You can use:
   - Your own legitimate certificates
   - Sample certificates from online sources
   - The sample Infosys certificate you provided

3. **Save the certificate images** to the `backend/test-data` directory with descriptive names:
   - `sample-certificate.jpg` - A legitimate certificate
   - `modified-certificate.jpg` - A modified certificate (for testing fraud detection)

## Testing the Verification System

### Using the Web Interface

1. Start the application:
   ```
   npm run dev
   ```

2. Navigate to the verification page at `/verify`

3. Upload your test certificate image

4. Fill in the certificate details:
   - **Title**: Exact title from the certificate
   - **Issuer**: Organization that issued the certificate
   - **Issue Date**: When the certificate was issued
   - **Credential ID**: Unique ID on the certificate
   - **Credential URL**: Verification URL from the certificate
   - **Holder Name**: Name on the certificate

5. Click "Verify Certificate" and review the results

### Using the Test Script

1. Place your test certificate in `backend/test-data/sample-certificate.jpg`

2. Update the certificate data in `backend/scripts/test-verification.js` to match your test certificate

3. Run the test script:
   ```
   cd backend
   node scripts/test-verification.js
   ```

4. Review the verification results in the console output

## Understanding Verification Results

The verification results will include:

- **Decision**: verified, rejected, or needs_review
- **Confidence Score**: Percentage indicating verification confidence
- **Reasoning**: Specific reasons for the decision
- **Red Flags**: Any suspicious aspects identified
- **Verification Details**: Detailed analysis of title, issuer, date matches, etc.

## Issuer Database Verification

The system now **automatically** verifies certificates against issuer databases without requiring users to toggle this feature on. This provides:

1. Enhanced security through cross-referencing
2. Higher confidence scores for certificates that pass issuer verification
3. Better fraud detection for certificates that fail issuer verification

## Troubleshooting

- If OCR text extraction fails, try a clearer image with better resolution
- Ensure the certificate details exactly match what's on the certificate
- For accurate verification, always provide the credential URL when available 