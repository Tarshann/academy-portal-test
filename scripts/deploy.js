const { execSync } = require('child_process');
const path = require('path');

console.log('Starting deployment process...');

try {
  // Build web application first
  console.log('Building web application...');
  require('./build-web');
  
  // Then deploy to Heroku
  console.log('Deploying to Heroku...');
  execSync('git push heroku main', { stdio: 'inherit' });
  
  console.log('Deployment completed successfully!');
} catch (error) {
  console.error('Error during deployment:', error.message);
  process.exit(1);
} 