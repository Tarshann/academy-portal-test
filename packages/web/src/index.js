import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Add global error handler for React
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  
  // Display error on screen
  const errorDiv = document.createElement('div');
  errorDiv.style.backgroundColor = '#ffdddd';
  errorDiv.style.color = '#ff0000';
  errorDiv.style.padding = '20px';
  errorDiv.style.margin = '20px';
  errorDiv.style.borderRadius = '5px';
  errorDiv.innerHTML = `
    <h3>Error Loading Application</h3>
    <p>${message}</p>
    <p>Source: ${source}</p>
    <p>Line: ${lineno}, Column: ${colno}</p>
  `;
  
  document.body.prepend(errorDiv);
  return true;
};

console.log('React initialization starting');

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found! Make sure the HTML has a div with id="root"');
  }
  
  console.log('Creating React root');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering React app');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('React rendering complete');
  
  // Add class to indicate React has loaded
  document.body.classList.add('react-loaded');
} catch (error) {
  console.error('Error initializing React:', error);
} 