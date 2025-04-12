// auth.js - Client-side authentication functionality

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginBtn = document.getElementById('back-to-login');
    const authMessage = document.getElementById('auth-message');
    
    // API endpoints
    const API_URL = '/api';
    const ENDPOINTS = {
        login: `${API_URL}/auth/login`,
        register: `${API_URL}/auth/register`,
        forgotPassword: `${API_URL}/auth/forgot-password`,
        googleLogin: `${API_URL}/auth/google-login`,
        facebookLogin: `${API_URL}/auth/facebook-login`
    };
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => form.classList.remove('active'));
            if (tabName === 'login') {
                loginForm.classList.add('active');
            } else if (tabName === 'register') {
                registerForm.classList.add('active');
            }
            
            // Clear any messages
            clearMessages();
        });
    });
    
    // Toggle password visibility
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Password strength meter
    const passwordInput = document.getElementById('register-password');
    const strengthMeter = document.querySelector('.strength-meter-fill');
    const strengthText = document.querySelector('.strength-text span');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            
            strengthMeter.setAttribute('data-strength', strength);
            
            switch(strength) {
                case 0:
                    strengthText.textContent = 'Weak';
                    break;
                case 1:
                    strengthText.textContent = 'Fair';
                    break;
                case 2:
                    strengthText.textContent = 'Good';
                    break;
                case 3:
                    strengthText.textContent = 'Strong';
                    break;
            }
        });
    }
    
    // Calculate password strength
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 1;
        
        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        return Math.min(3, Math.floor(strength * 0.75));
    }
    
    // Show forgot password form
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            authForms.forEach(form => form.classList.remove('active'));
            forgotPasswordForm.classList.add('active');
            
            // Clear any messages
            clearMessages();
        });
    }
    
    // Back to login from forgot password
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', function() {
            authForms.forEach(form => form.classList.remove('active'));
            loginForm.classList.add('active');
            
            // Clear any messages
            clearMessages();
        });
    }
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;
            
            // Validate form
            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
                
                // Make API request
                const response = await fetch(ENDPOINTS.login, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Save token to localStorage if remember me is checked
                    if (rememberMe) {
                        localStorage.setItem('token', data.token);
                    } else {
                        sessionStorage.setItem('token', data.token);
                    }
                    
                    // Show success message
                    showMessage('Login successful! Redirecting...', 'success');
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    // Show error message
                    showMessage(data.message || 'Login failed. Please try again.', 'error');
                    
                    // Reset button
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            } catch (error) {
                showMessage('An error occurred. Please try again later.', 'error');
                console.error('Login error:', error);
                
                // Reset button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
    
    // Registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const firstName = document.getElementById('register-first-name').value;
            const lastName = document.getElementById('register-last-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-confirm-password').value;
            const role = document.getElementById('register-role').value;
            const termsAgreed = document.getElementById('terms-agree').checked;
            
            // Validate form
            if (!firstName || !lastName || !email || !password || !passwordConfirm) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== passwordConfirm) {
                showMessage('Passwords do not match', 'error');
                return;
            }
            
            if (!termsAgreed) {
                showMessage('You must agree to the Terms of Service and Privacy Policy', 'error');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
                
                // Make API request
                const response = await fetch(ENDPOINTS.register, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password,
                        passwordConfirm,
                        role
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show success message
                    showMessage('Registration successful! Please check your email to verify your account.', 'success');
                    
                    // Clear form
                    this.reset();
                    
                    // Switch to login tab after a delay
                    setTimeout(() => {
                        document.querySelector('[data-tab="login"]').click();
                    }, 3000);
                } else {
                    // Show error message
                    showMessage(data.message || 'Registration failed. Please try again.', 'error');
                    
                    // Reset button
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            } catch (error) {
                showMessage('An error occurred. Please try again later.', 'error');
                console.error('Registration error:', error);
                
                // Reset button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
    
    // Forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('forgot-email').value;
            
            // Validate form
            if (!email) {
                showMessage('Please enter your email address', 'error');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                
                // Make API request
                const response = await fetch(ENDPOINTS.forgotPassword, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show success message
                    showMessage('Password reset link sent to your email!', 'success');
                    
                    // Clear form
                    this.reset();
                    
                    // Switch to login tab after a delay
                    setTimeout(() => {
                        backToLoginBtn.click();
                    }, 3000);
                } else {
                    // Show error message
                    showMessage(data.message || 'Failed to send reset link. Please try again.', 'error');
                    
                    // Reset button
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            } catch (error) {
                showMessage('An error occurred. Please try again later.', 'error');
                console.error('Forgot password error:', error);
                
                // Reset button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
    
    // Social login - Google
    const googleLoginBtn = document.getElementById('google-login');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function() {
            // In a real implementation, this would use the Google OAuth API
            // For now, we'll simulate the process
            simulateSocialLogin('google');
        });
    }
    
    // Social login - Facebook
    const facebookLoginBtn = document.getElementById('facebook-login');
    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', function() {
            // In a real implementation, this would use the Facebook OAuth API
            // For now, we'll simulate the process
            simulateSocialLogin('facebook');
        });
    }
    
    // Simulate social login (for demonstration purposes)
    function simulateSocialLogin(provider) {
        showMessage(`Connecting to ${provider}...`, 'info');
        
        setTimeout(() => {
            // In a real implementation, this would handle the OAuth flow
            // and then send the token to our backend
            
            // For now, just show a success message and redirect
            showMessage(`${provider} login successful! Redirecting...`, 'success');
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        }, 1000);
    }
    
    // Show message function
    function showMessage(message, type) {
        // Clear any existing messages
        clearMessages();
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.textContent = message;
        
        // Add to DOM
        authMessage.appendChild(messageElement);
        
        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageElement.remove();
            }, 5000);
        }
    }
    
    // Clear messages function
    function clearMessages() {
        authMessage.innerHTML = '';
    }
    
    // Check URL parameters for verification status
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get('verified');
        
        if (verified === 'true') {
            showMessage('Email verified successfully! You can now log in.', 'success');
        }
    }
    
    // Run on page load
    checkUrlParams();
});
