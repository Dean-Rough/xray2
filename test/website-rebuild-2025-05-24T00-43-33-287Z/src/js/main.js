// Main JavaScript for Repeat Website

class RepeatWebsite {
  constructor() {
    this.init();
  }

  init() {
    this.setupHeader();
    this.setupForms();
    this.setupAnimations();
    this.setupAccessibility();
  }

  // Header functionality
  setupHeader() {
    const header = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.header__nav-link');
    const navBackground = document.querySelector('.header__nav-background');
    
    if (!header || !navBackground) return;

    // Update navigation background position
    this.updateNavBackground(navLinks, navBackground);
    
    // Handle navigation link clicks
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Remove selected class from all links
        navLinks.forEach(l => l.classList.remove('header__nav-link--selected'));
        // Add selected class to clicked link
        e.target.classList.add('header__nav-link--selected');
        // Update background position
        this.updateNavBackground(navLinks, navBackground);
      });
    });

    // Header scroll behavior
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
      } else {
        header.style.backgroundColor = 'var(--white)';
        header.style.backdropFilter = 'none';
      }
      
      lastScrollY = currentScrollY;
    });
  }

  updateNavBackground(navLinks, navBackground) {
    const selectedLink = document.querySelector('.header__nav-link--selected');
    if (!selectedLink) return;

    const linkRect = selectedLink.getBoundingClientRect();
    const navRect = selectedLink.parentElement.getBoundingClientRect();
    
    navBackground.style.width = `${linkRect.width + 16}px`;
    navBackground.style.height = `${linkRect.height + 8}px`;
    navBackground.style.left = `${linkRect.left - navRect.left - 8}px`;
  }

  // Form functionality
  setupForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(form);
      });
    });
  }

  handleFormSubmit(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    
    if (!this.validateEmail(email)) {
      this.showFormMessage(form, 'Please enter a valid email address.', 'error');
      return;
    }

    // Simulate form submission
    this.showFormMessage(form, 'Thank you for subscribing!', 'success');
    form.reset();
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showFormMessage(form, message, type) {
    // Remove existing message
    const existingMessage = form.querySelector('.form__message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `form__message form__message--${type}`;
    messageEl.textContent = message;
    
    form.appendChild(messageEl);
    
    // Remove message after 5 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }

  // Animation setup
  setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.card, .grid-title-image, .section');
    animateElements.forEach(el => {
      observer.observe(el);
    });
  }

  // Accessibility enhancements
  setupAccessibility() {
    // Skip to main content link
    this.createSkipLink();
    
    // Keyboard navigation for custom elements
    this.setupKeyboardNavigation();
    
    // Focus management
    this.setupFocusManagement();
  }

  createSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link sr-only';
    skipLink.addEventListener('focus', () => {
      skipLink.classList.remove('sr-only');
    });
    skipLink.addEventListener('blur', () => {
      skipLink.classList.add('sr-only');
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  setupKeyboardNavigation() {
    // Handle Enter and Space key for button-like elements
    const buttonElements = document.querySelectorAll('[role="button"]:not(button)');
    
    buttonElements.forEach(element => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      });
    });
  }

  setupFocusManagement() {
    // Ensure focus is visible for keyboard users
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
}

// Utility functions
const utils = {
  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Smooth scroll to element
  scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RepeatWebsite();
});

// Export for module usage
export { RepeatWebsite, utils };
