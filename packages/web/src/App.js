import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log('App component mounted');
    document.title = 'Academy Portal';
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Academy Portal</h1>
        <p>Welcome to the Academy Portal Web Application</p>
      </header>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>If you can see this, the application is working correctly!</p>
      </div>
    </div>
  );
}

export default App; 