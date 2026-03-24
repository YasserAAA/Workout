// pwa.js
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';

export const PWA = {
    init(state) {
        this.state = state;
        this.setupEventListeners();
        this.checkInstallStatus();
        this.checkServiceWorker();
        this.registerServiceWorker(); // Register service worker
        this.setupPeriodicUpdateChecks();
    },

    setupPeriodicUpdateChecks() {
        this.checkForUpdates(); // Check on startup
        // Set up periodic update checks (every 4 hours)
        setInterval(() => this.checkForUpdates(), 4 * 60 * 60 * 1000);
        this.onUpdateAvailable(() => {
            Utils.showAlert('New version available. Refresh to update.', 'info');
        });
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
                    this.showUpdateNotification();
                }
            });
        });
    },

    showUpdateNotification() {
        Utils.showAlert('New version available. Refresh to update.', 'info', 0);

        // Add a refresh button to the alert
        setTimeout(() => {
            const alertElement = document.querySelector('.alert:last-child');
            if (alertElement) {
                const refreshBtn = document.createElement('button');
                refreshBtn.className = 'btn btn-sm btn-outline-light ms-3';
                refreshBtn.textContent = 'Refresh';
                refreshBtn.onclick = () => window.location.reload();
                alertElement.appendChild(refreshBtn);
            }
        }, 100);
    },

    checkServiceWorker() {
        if ('serviceWorker' in navigator) {
            return navigator.serviceWorker.getRegistration()
                .then(registration => {
                    const hasSW = !!registration;
                    console.log('Service Worker registered:', hasSW);

                    if (!hasSW) {
                        console.warn('Service Worker not registered');
                        // Try to register it
                        this.registerServiceWorker();
                    }

                    return hasSW;
                })
                .catch(error => {
                    console.error('Service Worker check failed:', error);
                    return false;
                });
        }
        console.log('Service Workers not supported');
        return Promise.resolve(false);

    },

    setupEventListeners() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => this.handleBeforeInstallPrompt(e));

        // Listen for app installed event
        window.addEventListener('appinstalled', (e) => this.handleAppInstalled(e));

        // Install button click
        DOM.installBtn.addEventListener('click', () => this.installApp());

        // Check for updates when app becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });

        // Check for updates when online status changes
        window.addEventListener('online', () => {
            this.checkForUpdates();
        });
    },

    handleBeforeInstallPrompt(e) {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();

        // Stash the event so it can be triggered later
        this.state.deferredPrompt = e;
        this.state.showInstallButton = true;

        // Update UI
        this.updateInstallButton();

        console.log('Before install prompt fired');
    },

    handleAppInstalled(evt) {
        console.log('App was successfully installed');
        this.state.isAppInstalled = true;
        this.state.showInstallButton = false;
        this.state.deferredPrompt = null;

        // Update UI
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

                // Update UI
                this.updateInstallButton();
            });
        }
    },

    checkInstallStatus() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('Running as PWA');
            this.state.isAppInstalled = true;
            this.state.showInstallButton = false;
            document.body.classList.add('pwa-mode');
        }

        // Update UI
        this.updateInstallButton();
    },

    updateInstallButton() {
        if (this.state.showInstallButton && !this.state.isAppInstalled) {
            DOM.installBtn.classList.remove('hidden');
        } else {
            DOM.installBtn.classList.add('hidden');
        }
    },

    // Optional: Check if PWA is capable
    isPwaCapable() {
        return 'beforeinstallprompt' in window;
    },

    // Optional: Debug method
    debug() {
        console.log('PWA Status:');
        console.log('- Is installed:', this.state.isAppInstalled);
        console.log('- Show install button:', this.state.showInstallButton);
        console.log('- Has deferred prompt:', !!this.state.deferredPrompt);
        console.log('- PWA capable:', this.isPwaCapable());
    },

    checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration()
                .then(registration => {
                    if (registration) {
                        registration.update();
                        console.log('Checking for updates...');
                    }
                })
                .catch(error => {
                    console.error('Update check failed:', error);
                });
        }
    },

    onUpdateAvailable(callback) {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('New content available; please refresh.');
                if (callback && typeof callback === 'function') {
                    callback();
                }
            });
        }
    }

};