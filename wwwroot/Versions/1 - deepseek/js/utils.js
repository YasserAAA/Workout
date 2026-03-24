// utils.js
import { DOM } from './dom-elements.js';
import { AudioPlayer } from './audio.js';

export const Utils = {
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-notification alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
        `;

        DOM.alertContainer.appendChild(alert);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }
        }, 3000);
    },

    updateButtonStates(state) {
        if (state.isPaused) {
            DOM.startBtn.classList.remove('hidden');
            DOM.pauseBtn.classList.add('hidden');
            DOM.pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            DOM.startBtn.classList.add('hidden');
            DOM.pauseBtn.classList.remove('hidden');
            DOM.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }

        DOM.prevBtn.classList.remove('hidden');
        DOM.nextBtn.classList.remove('hidden');
    },

    playBeep() {
        AudioPlayer.playBeep();
    },
    playTripleBeep() {
        AudioPlayer.playTripleBeep();
    },
    playFinishBeep() {
        AudioPlayer.playFinishBeep();
    }
};