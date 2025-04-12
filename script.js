// Enhanced script.js for The Academy Communication Portal

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.main-nav') && navLinks.classList.contains('active')) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
    
    // Announcement slider functionality
    const announcementSlider = document.querySelector('.announcement-slider');
    const announcements = document.querySelectorAll('.announcement-card');
    const prevSlide = document.querySelector('.prev-slide');
    const nextSlide = document.querySelector('.next-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (announcementSlider && announcements.length > 0) {
        let currentSlide = 0;
        
        // Initialize slider
        updateSlider();
        
        // Previous slide button
        if (prevSlide) {
            prevSlide.addEventListener('click', function() {
                currentSlide = (currentSlide > 0) ? currentSlide - 1 : announcements.length - 1;
                updateSlider();
            });
        }
        
        // Next slide button
        if (nextSlide) {
            nextSlide.addEventListener('click', function() {
                currentSlide = (currentSlide < announcements.length - 1) ? currentSlide + 1 : 0;
                updateSlider();
            });
        }
        
        // Dot navigation
        if (dots.length > 0) {
            dots.forEach((dot, index) => {
                dot.addEventListener('click', function() {
                    currentSlide = index;
                    updateSlider();
                });
            });
        }
        
        // Auto slide every 5 seconds
        setInterval(function() {
            currentSlide = (currentSlide < announcements.length - 1) ? currentSlide + 1 : 0;
            updateSlider();
        }, 5000);
        
        // Update slider position and active dot
        function updateSlider() {
            announcementSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            // Update active dot
            dots.forEach((dot, index) => {
                if (index === currentSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    menuToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                }
                
                // Scroll to target
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.feature-card, .program-card, .event-item');
    
    // Add initial classes
    animateElements.forEach(element => {
        element.classList.add('animate-on-scroll');
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8
        );
    }
    
    // Animate elements when they come into view
    function animateOnScroll() {
        animateElements.forEach(element => {
            if (isInViewport(element)) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Run on load
    animateOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Current date in footer
    const currentYear = new Date().getFullYear();
    const copyrightYear = document.querySelector('.footer-bottom p');
    
    if (copyrightYear) {
        copyrightYear.innerHTML = `&copy; ${currentYear} The Academy Basketball Program. All rights reserved.`;
    }
    
    // Add active class to current page in navigation
    const currentPage = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.nav-links a');
    
    navItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        
        if (itemHref === currentPage || (currentPage === '' && itemHref === 'index.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
});
