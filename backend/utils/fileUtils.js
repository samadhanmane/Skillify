import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temp directory for file processing
const tempDir = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Create a temporary file from binary data
 * @param {Buffer} data - Binary data to write to file
 * @param {string} extension - File extension (default: .tmp)
 * @returns {Promise<string>} Path to the created temporary file
 */
export const createTempFile = async (data, extension = '.tmp') => {
  const filename = `${uuidv4()}${extension}`;
  const filePath = path.join(tempDir, filename);
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
};

/**
 * Remove a temporary file
 * @param {string} filePath - Path to the temporary file
 * @returns {Promise<void>}
 */
export const removeTempFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        // Just log the error but don't fail
        console.error('Error removing temp file:', err);
      }
      resolve();
    });
  });
};

/**
 * Clean up old temporary files (files older than 1 hour)
 * @returns {Promise<number>} Number of files cleaned up
 */
export const cleanupTempFiles = async () => {
  return new Promise((resolve, reject) => {
    fs.readdir(tempDir, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      let cleanedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(`Error getting stats for ${filePath}:`, err);
            return;
          }
          
          if (stats.mtimeMs < oneHourAgo) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error removing old temp file ${filePath}:`, err);
              } else {
                cleanedCount++;
              }
            });
          }
        });
      });
      
      resolve(cleanedCount);
    });
  });
}; 