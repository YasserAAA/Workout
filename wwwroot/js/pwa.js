// pwa.js - Simplified without version checking that causes reload loop
import { DOM } from './dom-elements.js';

export const PWA = {
    init(state) {
        this.state = state;
        this.setupEventListeners();
        this.checkInstallStatus();
        this.registerServiceWorker();
        this.setupMobileUpdateHandler();
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                        this.setupUpdateHandling(registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    },

    setupUpdateHandling(registration) {
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('SW update found: ', newWorker);

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New content is available; please refresh.');
                    this.showUpdateNotification(newWorker);
                }
            });
        });

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Controller changed, reloading page');
            window.location.reload();
        });
    },

    setupMobileUpdateHandler() {
        // Check if on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile && 'serviceWorker' in navigator) {
            // More frequent update checks on mobile
            setInterval(() => {
                navigator.serviceWorker.getRegistration().then(reg => {
                    if (reg) {
                        reg.update().then(() => {
                            console.log('Mobile update check at:', new Date().toLocaleTimeString());
                        });
                    }
                });
            }, 30 * 60 * 1000); // Check every 30 minutes

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                    this.showMobileUpdateNotification(event.data.version);
                }
            });
        }
    },

    // Modified to handle both regular updates and mobile-specific updates
    showUpdateNotification(newWorker, version = null) {
        // Create a simple notification without auto-reload
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible fade show';
        notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1060; max-width: 300px;';

        // Customize message based on whether it's a mobile update or regular update
        const message = version
            ? `<strong>Mobile Update Available</strong><p class="mb-1">Version ${version} is ready.</p>`
            : `<strong>Update Available</strong><p class="mb-1">A new version is ready.</p>`;

        notification.innerHTML = `
            <div>
                ${message}
                <button type="button" class="btn btn-sm btn-primary me-1" id="update-btn">
                    Update
                </button>
                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="alert">
                    Later
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        document.getElementById('update-btn').addEventListener('click', () => {
            if (newWorker) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
            notification.remove();
            window.location.reload();
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    },

    // Add this method to handle mobile update notifications
    showMobileUpdateNotification(version) {
        if (this.state.currentVersion !== version) {
            this.showUpdateNotification(null, version);
        }
    },

    setupEventListeners() {
        window.addEventListener('beforeinstallprompt', (e) => this.handleBeforeInstallPrompt(e));
        window.addEventListener('appinstalled', (e) => this.handleAppInstalled(e));
        DOM.installBtn.addEventListener('click', () => this.installApp());
    },

    handleBeforeInstallPrompt(e) {
        e.preventDefault();
        this.state.deferredPrompt = e;
        this.state.showInstallButton = true;
        this.updateInstallButton();
        console.log('Before install prompt fired');
    },

    handleAppInstalled(evt) {
        console.log('App was successfully installed');
        this.state.isAppInstalled = true;
        this.state.showInstallButton = false;
        this.state.deferredPrompt = null;
        this.updateInstallButton();
        Utils.showAlert('App installed successfully!', 'success');
    },

    installApp() {
        if (this.state.deferredPrompt) {
            this.state.deferredPrompt.prompt();
            this.state.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    this.state.showInstallButton = false;
                } else {
                    console.log('User dismissed the install prompt');
                }
                this.state.deferredPrompt = null;
                this.updateInstallButton();
            });
        }
    },

    checkInstallStatus() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('Running as PWA');
            this.state.isAppInstalled = true;
            this.state.showInstallButton = false;
            document.body.classList.add('pwa-mode');
        }
        this.updateInstallButton();
    },

    updateInstallButton() {
        if (this.state.showInstallButton && !this.state.isAppInstalled) {
            DOM.installBtn.classList.remove('hidden');
        } else {
            DOM.installBtn.classList.add('hidden');
        }
    }
};