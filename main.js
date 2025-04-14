  document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.querySelector('form[action="/register"]');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const firstName = document.querySelector('input[name="firstName"]').value;
      const lastName = document.querySelector('input[name="lastName"]').value;
      const email = document.querySelector('input[name="email"]').value;
      const phoneNumber = document.querySelector('input[name="phoneNumber"]').value;
      const password = document.querySelector('input[name="password"]').value;
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phoneNumber,
            password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('Registration successful!');
          window.location.href = '/login';
        } else {
          alert(data.msg || 'Registration failed');
          console.error(data);
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration');
      }
    });
  }
});
