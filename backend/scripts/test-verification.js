/**
 * Test script for enhanced GPT-4 certificate verification
 * 
 * Usage: node test-verification.js
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:4000/api/ml/verify-certificate';
const TEST_IMAGE_PATH = path.join(__dirname, '..', 'test-data', 'sample-certificate.jpg');
const VERBOSE = true;

// Sample certificate data for Infosys certificate
const certificateData = {
  title: 'Introduction to Cyber Security',
  issuer: 'Infosys Springboard',
  issueDate: '2024-07-31',
  credentialID: '', // No explicit credential ID visible in the sample
  credentialURL: 'https://verify.onwingspan.com',
  holderName: 'Samadhan Mane'
};

/**
 * Convert image to base64
 */
function imageToBase64(filePath) {
  try {
    const image = fs.readFileSync(filePath);
    return `data:image/jpeg;base64,${image.toString('base64')}`;
  } catch (error) {
    console.error('Error reading image file:', error);
    return null;
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('🧪 Running certificate verification test');
  console.log('----------------------------------------');
  
  // Check if test image exists
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.error(`❌ Test image not found at ${TEST_IMAGE_PATH}`);
    console.log('Create a test-data directory with a sample-certificate.jpg file');
    return;
  }
  
  // Convert image to base64
  const imageBase64 = imageToBase64(TEST_IMAGE_PATH);
  if (!imageBase64) {
    console.error('❌ Failed to convert image to base64');
    return;
  }
  
  // Prepare request data
  const requestData = {
    ...certificateData,
    imageUrl: imageBase64
  };
  
  console.log('📤 Sending verification request...');
  if (VERBOSE) {
    console.log('Request data:', {
      ...requestData,
      imageUrl: '(Base64 image data - truncated)'
    });
  }
  
  try {
    // Send request to verification API
    const response = await axios.post(API_URL, requestData);
    
    // Process response
    if (response.data.success) {
      console.log('✅ Verification API request successful');
      
      const verification = response.data.verification;
      
      console.log('\n📋 Verification Results:');
      console.log('----------------------------------------');
      console.log(`Decision: ${verification.aiDecision}`);
      console.log(`Confidence Score: ${verification.confidenceScore}%`);
      console.log(`Enhanced GPT Verification: ${verification.enhancedVerification ? 'Yes' : 'No'}`);
      
      console.log('\n🔍 Verification Details:');
      if (verification.reasoning && verification.reasoning.length > 0) {
        console.log('Reasoning:');
        verification.reasoning.forEach(reason => console.log(`  • ${reason}`));
      }
      
      if (verification.redFlags && verification.redFlags.length > 0) {
        console.log('\nRed Flags:');
        verification.redFlags.forEach(flag => console.log(`  • ${flag}`));
      }
      
      if (VERBOSE) {
        console.log('\n🔬 Technical Details:');
        console.log('- Image Integrity Score:', verification.verificationResult.imageIntegrityScore);
        console.log('- Text Match Score:', verification.verificationResult.textMatchScore);
        
        console.log('\n📝 Extracted Text (truncated):');
        const truncatedText = verification.extractedText.substring(0, 200) + 
          (verification.extractedText.length > 200 ? '...' : '');
        console.log(truncatedText);
      }
    } else {
      console.error('❌ Verification failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error calling verification API:', error.response?.data?.message || error.message);
  }
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
}); 