const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the mobile package
const mobilePath = path.join(__dirname, '../packages/mobile');

console.log('Building mobile application...');

try {
  // Install dependencies if needed
  if (!fs.existsSync(path.join(mobilePath, 'node_modules'))) {
    console.log('Installing mobile dependencies...');
    execSync('npm install', { cwd: mobilePath, stdio: 'inherit' });
  }

  // Build the mobile app (this would normally be platform-specific)
  console.log('Running build script...');
  
  // For Android
  // execSync('npm run android -- --variant=release', { cwd: mobilePath, stdio: 'inherit' });
  
  // For iOS
  // execSync('npm run ios -- --configuration Release', { cwd: mobilePath, stdio: 'inherit' });
  
  console.log('Mobile application build step skipped (requires platform-specific setup)');
} catch (error) {
  console.error('Error building mobile application:', error.message);
  process.exit(1);
} 