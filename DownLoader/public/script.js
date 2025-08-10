// Landing page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Setup modal functionality
    setupModal();
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
            // Redirect to dashboard if already logged in
            window.location.href = '/dashboard';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// Google OAuth login
function login() {
    window.location.href = '/auth/google';
}

// Show demo modal
function showDemo() {
    const modal = document.getElementById('demoModal');
    modal.style.display = 'block';
    
    // Add fade-in animation
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('demoModal');
    const closeBtn = document.querySelector('.close');
    
    // Close modal when clicking the X
    closeBtn.onclick = function() {
        closeModal();
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// Close modal
function closeModal() {
    const modal = document.getElementById('demoModal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Add smooth scroll animation for better UX
document.addEventListener('DOMContentLoaded', function() {
    // Add entrance animations
    const elements = document.querySelectorAll('.feature, .login-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add hover effects for interactive elements
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.google-btn, .demo-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Add loading state for buttons
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// Store original button text
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.google-btn, .demo-btn');
    buttons.forEach(button => {
        button.dataset.originalText = button.innerHTML;
    });
});

// Add error handling for network issues
window.addEventListener('online', function() {
    showNotification('Connection restored!', 'success');
});

window.addEventListener('offline', function() {
    showNotification('No internet connection. Please check your network.', 'error');
});

// Simple notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Add smooth page transitions
document.addEventListener('DOMContentLoaded', function() {
    // Add page transition class
    document.body.classList.add('page-loaded');
    
    // Add CSS for page transitions
    const style = document.createElement('style');
    style.textContent = `
        body {
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        body.page-loaded {
            opacity: 1;
        }
        
        .notification {
            position: fixed;
            top: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            color: white;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 1001;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 400px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            background: #28a745;
        }
        
        .notification.error {
            background: #dc3545;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            margin-left: auto;
        }
    `;
    document.head.appendChild(style);
});
