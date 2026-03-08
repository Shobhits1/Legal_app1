/**
 * NyayaMitra Modern UI JavaScript
 * All interactive features and animations
 */

// ============================================
// PART 1: DARK MODE SYSTEM
// ============================================

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    init() {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateIcon();
        
        // Create toggle button if doesn't exist
        this.createToggleButton();
        
        // Listen for toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggle());
    }
    
    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.updateIcon();
        this.animateTransition();
    }
    
    updateIcon() {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    animateTransition() {
        const html = document.documentElement;
        html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            html.style.transition = '';
        }, 300);
    }
    
    createToggleButton() {
        if (document.getElementById('themeToggle')) return;
        
        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'theme-toggle';
        toggleDiv.innerHTML = `
            <button id="themeToggle" class="btn-theme-toggle" aria-label="Toggle theme" title="Toggle dark/light mode">
                <i class="fas fa-moon" id="themeIcon"></i>
            </button>
        `;
        document.body.appendChild(toggleDiv);
    }
}

// ============================================
// PART 2: TOAST NOTIFICATION SYSTEM
// ============================================

class ToastManager {
    constructor() {
        this.container = this.createContainer();
    }
    
    createContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    show(message, type = 'info', duration = 3000) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress"></div>
        `;
        
        this.container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        return toast;
    }
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// ============================================
// PART 3: ANIMATED COUNTER
// ============================================

function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Intersection Observer for counters
function initCounters() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const target = parseInt(entry.target.dataset.count);
                animateCounter(entry.target, target);
                entry.target.dataset.animated = 'true';
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

// ============================================
// PART 4: RIPPLE EFFECT
// ============================================

function addRippleEffect(elements) {
    elements.forEach(element => {
        element.addEventListener('click', function(e) {
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 600);
        });
    });
}

// ============================================
// PART 5: SMOOTH PAGE TRANSITIONS
// ============================================

function initPageTransitions() {
    // Create transition overlay if doesn't exist
    let overlay = document.querySelector('.page-transition');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'page-transition';
        overlay.innerHTML = '<div class="transition-loader"></div>';
        document.body.appendChild(overlay);
    }
    
    // Handle tab transitions
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            overlay.classList.add('active');
            
            setTimeout(() => {
                const bsTab = new bootstrap.Tab(this);
                bsTab.show();
                
                setTimeout(() => {
                    overlay.classList.remove('active');
                }, 300);
            }, 400);
        });
    });
}

// ============================================
// PART 6: DRAG & DROP FILE UPLOAD
// ============================================

class FileUploader {
    constructor(zoneId, inputId) {
        this.zone = document.getElementById(zoneId);
        this.input = document.getElementById(inputId);
        
        if (this.zone && this.input) {
            this.init();
        }
    }
    
    init() {
        // Click to upload
        this.zone.addEventListener('click', () => this.input.click());
        
        // Drag events
        ['dragenter', 'dragover'].forEach(eventName => {
            this.zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                this.zone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                this.zone.classList.remove('drag-over');
            });
        });
        
        // Drop handler
        this.zone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
        
        // File input change
        this.input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }
    
    handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validate file type
        const validTypes = ['application/pdf', 'text/plain'];
        if (!validTypes.includes(file.type)) {
            window.toast.error('Invalid file type. Please upload PDF or TXT files.');
            return;
        }
        
        // Validate file size (16MB)
        if (file.size > 16 * 1024 * 1024) {
            window.toast.error('File too large. Maximum size is 16MB.');
            return;
        }
        
        // Show preview
        this.showPreview(file);
        window.toast.success('File selected: ' + file.name);
    }
    
    showPreview(file) {
        const preview = document.getElementById('fileInfo');
        if (preview) {
            const html = `
                <div class="alert alert-info">
                    <div class="d-flex align-items-center gap-3">
                        <div class="file-preview-icon">
                            <i class="fas fa-file-pdf fa-2x text-danger"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="fw-bold">${file.name}</div>
                            <div class="small text-muted">${this.formatFileSize(file.size)}</div>
                        </div>
                    </div>
                </div>
            `;
            preview.innerHTML = html;
            preview.style.display = 'block';
            
            const processBtn = document.getElementById('processFile');
            if (processBtn) {
                processBtn.disabled = false;
            }
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// ============================================
// PART 7: LOADING SKELETON
// ============================================

class LoadingManager {
    static showSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const skeleton = `
            <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
                <div class="skeleton skeleton-text" style="width: 90%;"></div>
            </div>
        `;
        
        container.innerHTML = skeleton;
    }
    
    static hideSkeleton(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
    }
    
    static showSpinner(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }
}

// ============================================
// PART 8: SMOOTH SCROLL
// ============================================

function smoothScroll(targetId) {
    const element = document.getElementById(targetId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// ============================================
// PART 9: ENHANCED CARD ANIMATIONS
// ============================================

function initCardAnimations() {
    const cards = document.querySelectorAll('.demo-card, .demo-card-modern');
    
    cards.forEach(card => {
        // Add parallax effect on mouse move
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ============================================
// PART 10: LAZY LOADING IMAGES
// ============================================

function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ============================================
// PART 11: SCROLL REVEAL ANIMATIONS
// ============================================

function initScrollReveal() {
    const elements = document.querySelectorAll('.fade-in, .slide-up');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ============================================
// PART 12: ENHANCED CHARTS
// ============================================

function createModernChart(canvasId, data, type = 'doughnut') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    const chartConfig = {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 13,
                            family: 'Inter'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    return new Chart(ctx, chartConfig);
}

// ============================================
// PART 13: FORM VALIDATION
// ============================================

function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// ============================================
// PART 14: COPY TO CLIPBOARD
// ============================================

function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            window.toast.success(successMessage);
        }).catch(err => {
            window.toast.error('Failed to copy: ' + err.message);
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            window.toast.success(successMessage);
        } catch (err) {
            window.toast.error('Failed to copy');
        }
        document.body.removeChild(textarea);
    }
}

// ============================================
// PART 15: KEYBOARD SHORTCUTS
// ============================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="text"], textarea');
            if (searchInput) searchInput.focus();
        }
        
        // Ctrl/Cmd + D: Toggle dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            window.themeManager?.toggle();
        }
        
        // Escape: Close modals/overlays
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.show');
            if (activeModal) {
                bootstrap.Modal.getInstance(activeModal)?.hide();
            }
        }
    });
}

// ============================================
// MAIN INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NyayaMitra Modern UI Initialized');
    
    // Initialize all modules
    window.themeManager = new ThemeManager();
    window.toast = new ToastManager();
    window.fileUploader = new FileUploader('uploadArea', 'fileInput');
    
    // Initialize features
    initCounters();
    initPageTransitions();
    initCardAnimations();
    initLazyLoading();
    initScrollReveal();
    initKeyboardShortcuts();
    
    // Add ripple effect to demo cards
    const demoCards = document.querySelectorAll('.demo-card-modern');
    addRippleEffect(demoCards);
    
    // Replace old showAlert function with toast
    if (typeof window.showAlert !== 'undefined') {
        const oldShowAlert = window.showAlert;
        window.showAlert = function(message, type) {
            window.toast.show(message, type);
        };
    }
    
    // Replace old showLoading function
    if (typeof window.showLoading !== 'undefined') {
        const oldShowLoading = window.showLoading;
        window.showLoading = function(show) {
            LoadingManager.showSpinner(show);
        };
    }
    
    // Welcome toast (only once per session)
    if (!sessionStorage.getItem('welcomeShown')) {
        setTimeout(() => {
            window.toast.success('Welcome to NyayaMitra! ⚖️ Try the new dark mode toggle!', 4000);
            sessionStorage.setItem('welcomeShown', 'true');
        }, 1000);
    }
    
    console.log('✅ All UI features loaded successfully!');
});

// Export for global use
window.ModernUI = {
    toast: () => window.toast,
    theme: () => window.themeManager,
    loading: LoadingManager,
    animateCounter,
    smoothScroll,
    copyToClipboard,
    validateForm
};
