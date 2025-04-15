const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the web package
const webPath = path.join(__dirname, '../packages/web');

console.log('Building web application...');

try {
  // Install dependencies if needed
  if (!fs.existsSync(path.join(webPath, 'node_modules'))) {
    console.log('Installing web dependencies...');
    execSync('npm install', { cwd: webPath, stdio: 'inherit' });
  }

  // Use npm workspaces to build the web app
  console.log('Running build script...');
  execSync('npm run build -w @academy-portal/web', { stdio: 'inherit' });

  console.log('Web application built successfully!');
} catch (error) {
  console.error('Error building web application:', error.message);
  process.exit(1);
} 