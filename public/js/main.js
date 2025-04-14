// Base functions for The Academy Portal

// DOM Ready function
document.addEventListener('DOMContentLoaded', function() {
  console.log('The Academy Portal loaded successfully');
  
  // Initialize any interactive elements
  initializeToggles();
  attachEventListeners();
});

// Initialize toggle elements
function initializeToggles() {
  const toggles = document.querySelectorAll('.toggle');
  if (toggles) {
    toggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.classList.toggle('hidden');
        }
      });
    });
  }
}

// Attach event listeners to interactive elements
function attachEventListeners() {
  // Form submission
  const forms = document.querySelectorAll('form');
  if (forms) {
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        // For now, we'll just log the submission
        // Later, we'll replace this with actual API calls
        e.preventDefault();
        console.log('Form submitted:', new FormData(form));
      });
    });
  }
  
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      const mobileMenu = document.querySelector('.mobile-menu');
      if (mobileMenu) {
        mobileMenu.classList.toggle('active');
      }
    });
  }
}

// Example function for API calls (to be implemented)
async function apiCall(endpoint, method, data) {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      },
      body: data ? JSON.stringify(data) : null
    });
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { error: true, message: error.message };
  }
}
