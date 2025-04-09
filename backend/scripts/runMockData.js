import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting MongoDB import process...');

// STEP 1: Import Admin Data
console.log('\n📥 Importing admin data...');
exec('node scripts/importAdminData.js', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error importing admin data: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Admin data import warnings: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('✅ Admin data import complete!');
  
  // STEP 2: Seed test users if needed
  console.log('\n📥 Creating test accounts...');
  exec('node scripts/seedUsers.js', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error creating test accounts: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Test account creation warnings: ${stderr}`);
    }
    
    console.log(stdout);
    console.log('✅ Test accounts created!');
    
    console.log('\n🚀 All mock data has been loaded into MongoDB!');
    console.log('📝 Login with:');
    console.log('   👨‍💼 Admin: admin@skillify.com / admin@1234');
    console.log('   👩‍💻 User: user@example.com / password123');
  });
}); 