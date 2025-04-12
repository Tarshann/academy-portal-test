// script.js - Functionality for The Academy Communication Portal

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember')?.checked || false;
            
            // For demonstration purposes - in a real app, this would send to a server
            console.log('Login attempt:', { email, password, remember });
            
            // Simulate authentication
            if (email && password) {
                // Store in localStorage if remember is checked
                if (remember) {
                    localStorage.setItem('academy_email', email);
                }
                
                // Redirect to dashboard (would be implemented in the full version)
                alert('Login successful! In the full implementation, you would be redirected to your dashboard.');
                // window.location.href = 'dashboard.html';
            } else {
                alert('Please enter both email and password.');
            }
        });
        
        // Auto-fill email if saved in localStorage
        const savedEmail = localStorage.getItem('academy_email');
        if (savedEmail) {
            document.getElementById('email').value = savedEmail;
            document.getElementById('remember').checked = true;
        }
    }
    
    // Password reset functionality (placeholder)
    const forgotPassword = document.querySelector('.forgot-password');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            if (email) {
                alert(`Password reset link would be sent to ${email} in the full implementation.`);
            } else {
                alert('Please enter your email address first.');
            }
        });
    }
    
    // Registration link (placeholder)
    const registerLink = document.querySelector('.register-link');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Registration form would open in the full implementation.');
            // window.location.href = 'register.html';
        });
    }
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
