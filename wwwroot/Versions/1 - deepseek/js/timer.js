// timer.js
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';
import { Workout } from './workout.js'; // Add this import

export const Timer = {
    startCurrentItemTimer(state) {
        if (state.currentTimer) {
            cancelAnimationFrame(state.currentTimer);
        }

        const elapsedTime = state.totalTime - state.remainingTime;
        state.timerStartTime = Date.now() - (elapsedTime * 1000);

        this.updateTimerDisplay(state);

        // Reset countdown beep state
        state.countdownBeepPlayed = false;

        function animateTimer() {
            if (!state.isPaused) {
                const elapsedSeconds = Math.floor((Date.now() - state.timerStartTime) / 1000);
                state.remainingTime = Math.max(0, state.totalTime - elapsedSeconds);

                Timer.updateTimerDisplay(state);

                // Play triple beep during last 3 seconds (only once)
                if (state.remainingTime <= 3 && state.remainingTime > 0 && !state.countdownBeepPlayed) {
                    state.countdownBeepPlayed = true;
                    Utils.playTripleBeep(); // Play the 3-second triple beep
                }

                if (state.remainingTime <= 0) {
                    cancelAnimationFrame(state.currentTimer);
                    state.currentTimer = null;

                    // Play completion triple beep
                    //Utils.playTripleBeep(); -- this is buggy, so we don't play it here

                    Workout.nextItem(state);
                } else {
                    state.currentTimer = requestAnimationFrame(animateTimer);
                }
            }
        }

        state.currentTimer = requestAnimationFrame(animateTimer);
    },

    startRepTimer(state) {
        if (state.repModeTimer) {
            clearInterval(state.repModeTimer);
        }

        if (state.isPaused) {
            state.repStartTime = Date.now() - state.repElapsedTime;
        } else {
            state.repStartTime = Date.now();
        }

        // Update immediately
        state.repElapsedTime = Date.now() - state.repStartTime;
        const seconds = Math.floor(state.repElapsedTime / 1000);
        DOM.repTimer.textContent = `Elapsed: ${Utils.formatTime(seconds)}`;

        state.repModeTimer = setInterval(() => {
            if (!state.isPaused) {
                state.repElapsedTime = Date.now() - state.repStartTime;
                const seconds = Math.floor(state.repElapsedTime / 1000);
                DOM.repTimer.textContent = `Elapsed: ${Utils.formatTime(seconds)}`;
            }
        }, 100);
    },

    updateTimerDisplay(state) {
        DOM.timerDisplay.textContent = Utils.formatTime(state.remainingTime);
        const progressPercent = ((state.totalTime - state.remainingTime) / state.totalTime) * 100;
        DOM.progressBarInner.style.width = `${progressPercent}%`;
        DOM.currentTime.textContent = `${Utils.formatTime(state.remainingTime)}`;
    },

    togglePause(state) {
        if (state.isPaused) {
            // Resume
            state.isPaused = false;
            state.totalPausedTime += (Date.now() - state.pauseStartTime);
            Utils.updateButtonStates(state);

            if (state.isRepModeActive) {
                state.repStartTime = Date.now() - state.repElapsedTime;
                this.startRepTimer(state);
            } else {
                this.startCurrentItemTimer(state);
            }
        } else {
            // Pause
            state.isPaused = true;
            state.pauseStartTime = Date.now();

            if (!state.isRepModeActive && state.currentTimer) {
                const elapsedTime = Math.floor((Date.now() - state.timerStartTime) / 1000);
                state.remainingTime = Math.max(0, state.totalTime - elapsedTime);
            }

            Utils.updateButtonStates(state);

            if (state.isRepModeActive && state.repModeTimer) {
                state.repElapsedTime = Date.now() - state.repStartTime;
                clearInterval(state.repModeTimer);
                state.repModeTimer = null;
            }

            if (state.currentTimer) {
                cancelAnimationFrame(state.currentTimer);
                state.currentTimer = null;
            }
        }
    }
};