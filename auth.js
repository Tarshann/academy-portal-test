// auth.js - Frontend JavaScript for authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Registration form handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const role = document.getElementById('role').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;
            
            // Validate form
            if (!firstName || !lastName || !email || !role || !password) {
                showAlert('Please fill in all required fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            
            if (!terms) {
                showAlert('You must agree to the Terms of Service and Privacy Policy', 'error');
                return;
            }
            
            // Submit registration
            try {
                showAlert('Creating your account...', 'info');
                
                // In a real implementation, this would send data to the server
                // const response = await fetch('/api/auth/register', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                //     body: JSON.stringify({
                //         firstName,
                //         lastName,
                //         email,
                //         phoneNumber: phone,
                //         role,
                //         password
                //     })
                // });
                
                // const data = await response.json();
                
                // if (response.ok) {
                //     showAlert('Registration successful! Please check your email to verify your account.', 'success');
                //     setTimeout(() => {
                //         window.location.href = 'login.html?registered=true';
                //     }, 2000);
                // } else {
                //     showAlert(data.message || 'Registration failed. Please try again.', 'error');
                // }
                
                // For demonstration purposes
                setTimeout(() => {
                    showAlert('Registration successful! Please check your email to verify your account.', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html?registered=true';
                    }, 2000);
                }, 1500);
                
            } catch (error) {
                showAlert('An error occurred. Please try again later.', 'error');
                console.error(error);
            }
        });
    }
    
    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Check for verification success message
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('verified') === 'true') {
            showAlert('Email verified successfully! You can now log in.', 'success');
        }
        if (urlParams.get('registered') === 'true') {
            showAlert('Registration successful! Please log in.', 'success');
        }
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember')?.checked || false;
            
            // Validate form
            if (!email || !password) {
                showAlert('Please enter both email and password', 'error');
                return;
            }
            
            // Submit login
            try {
                showAlert('Logging in...', 'info');
                
                // In a real implementation, this would send data to the server
                // const response = await fetch('/api/auth/login', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                //     body: JSON.stringify({
                //         email,
                //         password
                //     })
                // });
                
                // const data = await response.json();
                
                // if (response.ok) {
                //     // Store token in localStorage
                //     localStorage.setItem('token', data.token);
                //     
                //     // Store email if remember is checked
                //     if (remember) {
                //         localStorage.setItem('academy_email', email);
                //     } else {
                //         localStorage.removeItem('academy_email');
                //     }
                //     
                //     showAlert('Login successful!', 'success');
                //     setTimeout(() => {
                //         window.location.href = 'dashboard.html';
                //     }, 1000);
                // } else {
                //     showAlert(data.message || 'Login failed. Please check your credentials.', 'error');
                // }
                
                // For demonstration purposes
                setTimeout(() => {
                    // Store email if remember is checked
                    if (remember) {
                        localStorage.setItem('academy_email', email);
                    } else {
                        localStorage.removeItem('academy_email');
                    }
                    
                    showAlert('Login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }, 1500);
                
            } catch (error) {
                showAlert('An error occurred. Please try again later.', 'error');
                console.error(error);
            }
        });
        
        // Auto-fill email if saved in localStorage
        const savedEmail = localStorage.getItem('academy_email');
        if (savedEmail) {
            document.getElementById('email').value = savedEmail;
            if (document.getElementById('remember')) {
                document.getElementById('remember').checked = true;
            }
        }
    }
    
    // Social login handlers
    const googleLogin = document.getElementById('googleLogin');
    if (googleLogin) {
        googleLogin.addEventListener('click', function(e) {
            e.preventDefault();
            // In a real implementation, this would initiate Google OAuth flow
            showAlert('Google login would be initiated here in the full implementation', 'info');
        });
    }
    
    const facebookLogin = document.getElementById('facebookLogin');
    if (facebookLogin) {
        facebookLogin.addEventListener('click', function(e) {
            e.preventDefault();
            // In a real implementation, this would initiate Facebook OAuth flow
            showAlert('Facebook login would be initiated here in the full implementation', 'info');
        });
    }
    
    // Social registration handlers
    const googleRegister = document.getElementById('googleRegister');
    if (googleRegister) {
        googleRegister.addEventListener('click', function(e) {
            e.preventDefault();
            // In a real implementation, this would initiate Google OAuth flow
            showAlert('Google registration would be initiated here in the full implementation', 'info');
        });
    }
    
    const facebookRegister = document.getElementById('facebookRegister');
    if (facebookRegister) {
        facebookRegister.addEventListener('click', function(e) {
            e.preventDefault();
            // In a real implementation, this would initiate Facebook OAuth flow
            showAlert('Facebook registration would be initiated here in the full implementation', 'info');
        });
    }
    
    // Forgot password handler
    const forgotPassword = document.querySelector('.forgot-password');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            
            if (!email) {
                showAlert('Please enter your email address first', 'error');
                return;
            }
            
            // In a real implementation, this would send a password reset email
            showAlert(`Password reset instructions would be sent to ${email} in the full implementation`, 'info');
        });
    }
});

// Helper function to show alerts
function showAlert(message, type = 'info') {
    // Check if alert container exists, create if not
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        document.body.appendChild(alertContainer);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .alert-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            }
            
            .alert {
                padding: 15px 20px;
                margin-bottom: 15px;
                border-radius: 4px;
                color: white;
                font-weight: 500;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                animation: slideIn 0.3s ease-out forwards;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .alert-success {
                background-color: #4CAF50;
            }
            
            .alert-error {
                background-color: #F44336;
            }
            
            .alert-info {
                background-color: #2196F3;
            }
            
            .alert-warning {
                background-color: #FF9800;
            }
            
            .alert-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 10px;
                opacity: 0.7;
            }
            
            .alert-close:hover {
                opacity: 1;
            }
            
            @media (max-width: 480px) {
                .alert-container {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        ${message}
        <button class="alert-close">&times;</button>
    `;
    
    // Add to container
    alertContainer.appendChild(alert);
    
    // Add close button functionality
    const closeButton = alert.querySelector('.alert-close');
    closeButton.addEventListener('click', function() {
        alert.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}
