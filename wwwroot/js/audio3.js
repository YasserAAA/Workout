// audio.js - Refactored with clean code principles
export const AudioPlayer = {
    audioContext: null,
    isAudioSupported: false,
    activeBeeps: new Set(),

    // Audio parameters
    BEEP_CONFIG: {
        REGULAR: { frequency: 800, duration: 0.2, volume: 0.1, type: 'sine' },
        FINISH: { frequency: 1200, duration: 0.5, volume: 0.2, type: 'sine' },
        TRIPLE: { frequency: 800, duration: 0.2, volume: 0.1, type: 'sine', count: 3, interval: 1000 }
    },

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                this.isAudioSupported = true;
                console.log('Web Audio API initialized');
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.isAudioSupported = false;
        }
    },

    // Main public methods
    playBeep() {
        this.playSound(this.BEEP_CONFIG.REGULAR);
    },

    playFinishBeep() {
        this.stopAllBeeps();
        this.playSound(this.BEEP_CONFIG.FINISH);
    },

    playTripleBeep() {
        this.stopAllBeeps();
        this.playBeepSequence(
            this.BEEP_CONFIG.TRIPLE.count,
            this.BEEP_CONFIG.TRIPLE.interval,
            this.BEEP_CONFIG.TRIPLE.frequency,
            this.BEEP_CONFIG.TRIPLE.volume,
            this.BEEP_CONFIG.TRIPLE.duration
        );
    },

    // Core sound generation methods
    playSound(config) {
        if (!this.isAudioSupported) {
            this.showVisualFeedback(config.duration * 1000);
            return;
        }

        try {
            this.ensureAudioContext();
            this.createAndPlayOscillator(config);
        } catch (e) {
            console.warn('Error playing sound:', e);
            this.showVisualFeedback(config.duration * 1000);
        }
    },

    createAndPlayOscillator(config) {
        const beepId = this.generateBeepId();
        this.activeBeeps.add(beepId);

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        this.configureOscillator(oscillator, config);
        this.configureEnvelope(gainNode, config);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + config.duration);

        this.setupCleanup(oscillator, gainNode, beepId);
    },

    configureOscillator(oscillator, config) {
        oscillator.type = config.type;
        oscillator.frequency.value = config.frequency;
    },

    configureEnvelope(gainNode, config) {
        const now = this.audioContext.currentTime;

        if (config === this.BEEP_CONFIG.FINISH) {
            // Special envelope for finish beep (fade in + fade out)
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, now + config.duration);
        } else {
            // Standard envelope (fade out only)
            gainNode.gain.setValueAtTime(config.volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        }
    },

    setupCleanup(oscillator, gainNode, beepId) {
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
            this.activeBeeps.delete(beepId);
        };
    },

    // Sequence methods
    playBeepSequence(count, intervalMs, frequency, volume, duration) {
        if (!this.isAudioSupported) {
            this.showTripleVisualFeedback();
            return;
        }

        try {
            this.ensureAudioContext();

            for (let i = 0; i < count; i++) {
                this.playDelayedBeep(i * intervalMs / 1000, frequency, volume, duration, i);
            }
        } catch (e) {
            console.warn('Error playing beep sequence:', e);
            this.showTripleVisualFeedback();
        }
    },

    playDelayedBeep(delay, frequency, volume, duration, index) {
        setTimeout(() => {
            if (!this.isAudioSupported) return;

            try {
                const beepId = this.generateBeepId();
                this.activeBeeps.add(beepId);

                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.value = frequency;
                gainNode.gain.value = volume;

                const now = this.audioContext.currentTime;
                oscillator.start(now);
                oscillator.stop(now + duration);

                oscillator.onended = () => {
                    oscillator.disconnect();
                    gainNode.disconnect();
                    this.activeBeeps.delete(beepId);
                };

            } catch (e) {
                console.warn('Error playing delayed beep:', e);
            }
        }, delay * 1000);
    },

    // Utility methods
    ensureAudioContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    generateBeepId() {
        return Date.now() + Math.random();
    },

    stopAllBeeps() {
        this.activeBeeps.clear();
    },

    // Visual feedback methods
    showVisualFeedback(duration = 200) {
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            this.applyVisualFeedback(timerDisplay, 'beep-feedback', duration);
        }
    },

    showTripleVisualFeedback() {
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            this.applyVisualFeedback(timerDisplay, 'triple-beep-feedback', 3000);
        }
    },

    applyVisualFeedback(element, className, duration) {
        element.classList.remove(className);
        void element.offsetWidth; // Trigger reflow
        element.classList.add(className);

        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }
};