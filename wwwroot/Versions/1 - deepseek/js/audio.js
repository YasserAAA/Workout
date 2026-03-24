// audio.js - Update triple beep to last 3 seconds total
export const AudioPlayer = {
    audioContext: null,
    isAudioSupported: false,
    activeBeeps: new Set(), // Track active beeps to avoid conflicts

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

    playBeep() {
        if (!this.isAudioSupported) {
            this.showVisualFeedback(1000);
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const beepLong = 0.2; // 200ms beep duration
            const beepId = Date.now() + Math.random();
            this.activeBeeps.add(beepId);

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 800;

            // Set initial volume and fade-out
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + beepLong);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + beepLong);

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
                this.activeBeeps.delete(beepId);
            };

        } catch (e) {
            console.warn('Error playing beep sound:', e);
            this.showVisualFeedback(1000);
        }
    },

    playTripleBeep() {
        // Clear any existing beeps to avoid overlap
        this.stopAllBeeps();

        if (!this.isAudioSupported) {
            this.showTripleVisualFeedback();
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Play three beeps over 3 seconds total (1 second intervals)
            this.playBeepSequence(3, 1000, 800, 0.1, 0.2); // 200ms beeps, 1000ms intervals

        } catch (e) {
            console.warn('Error playing triple beep:', e);
            this.showTripleVisualFeedback();
        }
    },

    playFinishBeep() {
        // Clear any existing beeps to avoid overlap
        this.stopAllBeeps();

        if (!this.isAudioSupported) {
            this.showFinishVisualFeedback();
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const beepLong = 0.5; // 500ms beep duration (longer than regular beep)
            const beepId = Date.now() + Math.random();
            this.activeBeeps.add(beepId);

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 1200; // Higher pitch than regular beep

            // Set volume with a different envelope (fade in and out)
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + beepLong);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + beepLong);

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
                this.activeBeeps.delete(beepId);
            };

        } catch (e) {
            console.warn('Error playing finish beep sound:', e);
            this.showFinishVisualFeedback();
        }
    },

    playBeepSequence(count, intervalMs, frequency, volume, duration) {
        for (let i = 0; i < count; i++) {
            this.playBeepDelayed(i * intervalMs / 1000, frequency, volume, duration, i);
        }
    },

    playBeepDelayed(delay, frequency, volume, duration, index) {
        setTimeout(() => {
            if (!this.isAudioSupported) return;

            try {
                const beepId = Date.now() + Math.random() + index;
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

    stopAllBeeps() {
        // This method would stop all active beeps if needed
        // Currently just clears the tracking set
        this.activeBeeps.clear();
    },

    showVisualFeedback(duration = 200) {
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.classList.remove('beep-feedback');
            void timerDisplay.offsetWidth;
            timerDisplay.classList.add('beep-feedback');

            setTimeout(() => {
                timerDisplay.classList.remove('beep-feedback');
            }, duration);
        }
    },

    showTripleVisualFeedback() {
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.classList.remove('triple-beep-feedback');
            void timerDisplay.offsetWidth;
            timerDisplay.classList.add('triple-beep-feedback');

            setTimeout(() => {
                timerDisplay.classList.remove('triple-beep-feedback');
            }, 3000); // Match the 3-second duration
        }
    }
};