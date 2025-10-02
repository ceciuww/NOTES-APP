// src/js/install.js
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.setupInstallPrompt();
    }

    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });

        // Check if app is already installed
        if (this.isRunningAsPWA()) {
            this.hideInstallButton();
        }
    }

    showInstallButton() {
        // Create install button if it doesn't exist
        if (!this.installButton) {
            this.installButton = document.createElement('button');
            this.installButton.id = 'install-button';
            this.installButton.className = 'pwa-install-btn';
            this.installButton.innerHTML = `
                <i class="fas fa-download"></i>
                <span>Install App</span>
            `;
            this.installButton.addEventListener('click', () => this.installApp());
            
            // Add to DOM (you can customize the position)
            const header = document.querySelector('header nav');
            if (header) {
                header.appendChild(this.installButton);
            }
        }
        
        this.installButton.style.display = 'flex';
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            return;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    isRunningAsPWA() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }
}

export { PWAInstallManager };
