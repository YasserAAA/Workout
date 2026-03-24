// timer.js
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';
import { Workout } from './workout.js'; 

export const Timer = {
    startCurrentItemTimer(state) {
        if (state.currentTimer) {
            cancelAnimationFrame(state.currentTimer);
        }

        const elapsedTime = state.totalTime - state.remainingTime;
        state.timerStartTime = performance.now() - (elapsedTime * 1000);

        this.updateTimerDisplay(state);

        // Reset countdown beep state
        state.countdownBeepPlayed = false;

        const animateTimer = (currentTime) => {
            if (!state.isPaused) {
                const elapsedMilliseconds = currentTime - state.timerStartTime;
                const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
                state.remainingTime = Math.max(0, state.totalTime - elapsedSeconds);

                Timer.updateTimerDisplay(state);

                // Play triple beep during last 3 seconds (only once)
                if (state.remainingTime <= 3 && state.remainingTime > 0 && !state.countdownBeepPlayed) {
                    state.countdownBeepPlayed = true;
                    Utils.playTripleBeep();
                }

                if (state.remainingTime <= 0) {
                    state.currentTimer = null;
                    Workout.nextItem(state);
                } else {
                    state.currentTimer = requestAnimationFrame(animateTimer);
                }
            }
        };

        state.currentTimer = requestAnimationFrame(animateTimer);
    },

    startRepTimer(state) {
        if (state.repModeTimer) {
            cancelAnimationFrame(state.repModeTimer);
        }

        if (state.isPaused) {
            state.repStartTime = performance.now() - state.repElapsedTime;
        } else {
            state.repStartTime = performance.now();
        }

        const updateRepTimer = (currentTime) => {
            if (!state.isPaused) {
                state.repElapsedTime = currentTime - state.repStartTime;
                const seconds = Math.floor(state.repElapsedTime / 1000);
                DOM.repTimer.textContent = `Elapsed: ${Utils.formatTime(seconds)}`;
                state.repModeTimer = requestAnimationFrame(updateRepTimer);
            }
        };

        // Update immediately
        state.repElapsedTime = performance.now() - state.repStartTime;
        const seconds = Math.floor(state.repElapsedTime / 1000);
        DOM.repTimer.textContent = `Elapsed: ${Utils.formatTime(seconds)}`;

        state.repModeTimer = requestAnimationFrame(updateRepTimer);
    },

    updateTimerDisplay(state) {
        DOM.timerDisplay.textContent = Utils.formatTime(state.remainingTime);
        const progressPercent = ((state.totalTime - state.remainingTime) / state.totalTime) * 100;
        DOM.progressBarInner.style.width = `${progressPercent}%`;
        DOM.currentTime.textContent = `${Utils.formatTime(state.remainingTime)}`;
    },

    togglePause(state) {
        if (state.isPaused) {
            // Resume - but check if we're in background first
            if (document.hidden) {
                Utils.showAlert('Please bring the tab to foreground to resume', 'warning');
                return;
            }

            state.isPaused = false;
            // If this was a manual pause (not background auto-pause), add to totalPausedTime
            if (state.pauseStartTime && !state.backgroundPauseStart) {
                state.totalPausedTime += (performance.now() - state.pauseStartTime);
            }
            Utils.updateButtonStates(state);

            if (state.isRepModeActive) {
                state.repStartTime = performance.now() - state.repElapsedTime;
                this.startRepTimer(state);
            } else {
                this.startCurrentItemTimer(state);
            }
        } else {
            // Pause
            state.isPaused = true;
            state.pauseStartTime = performance.now();

            if (!state.isRepModeActive && state.currentTimer) {
                const elapsedTime = Math.floor((performance.now() - state.timerStartTime) / 1000);
                state.remainingTime = Math.max(0, state.totalTime - elapsedTime);
            }

            Utils.updateButtonStates(state);

            if (state.isRepModeActive && state.repModeTimer) {
                state.repElapsedTime = performance.now() - state.repStartTime;
                cancelAnimationFrame(state.repModeTimer);
                state.repModeTimer = null;
            }

            if (state.currentTimer) {
                cancelAnimationFrame(state.currentTimer);
                state.currentTimer = null;
            }
        }
    }
};