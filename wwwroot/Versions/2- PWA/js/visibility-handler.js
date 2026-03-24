// visibility-handler.js
import { Utils } from './utils.js';
import { Timer } from './timer.js';
import { Workout } from './workout.js';

export const VisibilityHandler = {
    init(state) {
        this.state = state;
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    },

    handleVisibilityChange() {
        const wasVisible = this.state.isTabVisible;
        this.state.isTabVisible = !document.hidden;

        if (wasVisible && !this.state.isTabVisible) {
            // Tab just became hidden
            this.handleTabHidden();
        } else if (!wasVisible && this.state.isTabVisible) {
            // Tab just became visible
            this.handleTabVisible();
        }
    },

    handleTabHidden() {
        if (!this.state.isPaused && this.state.currentTimer) {
            // Store the pause start time for background duration calculation
            this.state.backgroundPauseStart = Date.now();

            // Auto-pause when tab is hidden
            Timer.togglePause(this.state);
            Utils.showAlert('Timer paused while tab is in background', 'warning');

            // Store the time when tab was hidden for accurate resumption
            this.state.tabHiddenTime = Date.now();

            // Add visual indicator
            this.showBackgroundIndicator();
        }
    },

    handleTabVisible() {
        // Remove visual indicator
        this.removeBackgroundIndicator();

        if (this.state.isPaused && this.state.tabHiddenTime) {
            // Calculate time spent in background and add to total background time
            const backgroundDuration = Date.now() - this.state.backgroundPauseStart;
            this.state.totalBackgroundTime += backgroundDuration;

            delete this.state.backgroundPauseStart;

            if (this.state.isRepModeActive) {
                // Adjust rep timer for time hidden
                this.state.repStartTime += backgroundDuration;
            } else if (this.state.totalTime > 0) {
                // Adjust countdown timer for time hidden
                const elapsedDuringHide = Math.floor(backgroundDuration / 1000);
                this.state.remainingTime = Math.max(0, this.state.remainingTime - elapsedDuringHide);

                if (this.state.remainingTime === 0) {
                    // Timer ended while tab was hidden
                    Workout.nextItem(this.state);
                    return;
                }
            }

            // Offer to resume
            this.showResumePrompt();
        }
    },

    showBackgroundIndicator() {
        document.body.classList.add('body-background');
        const indicator = document.createElement('div');
        indicator.className = 'tab-background-indicator';
        indicator.innerHTML = '<i class="fas fa-pause-circle me-2"></i>Timer paused in background';
        indicator.id = 'background-indicator';
        document.body.appendChild(indicator);
    },

    removeBackgroundIndicator() {
        document.body.classList.remove('body-background');
        const indicator = document.getElementById('background-indicator');
        if (indicator) indicator.remove();
    },

    showResumePrompt() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        overlay.innerHTML = `
            <div style="background: var(--dark); padding: 2rem; border-radius: 10px; text-align: center;">
                <h4><i class="fas fa-clock me-2"></i>Timer Interrupted</h4>
                <p>Your timer was paused while this tab was in the background.</p>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                    <button id="resume-timer" class="btn btn-success">Resume Timer</button>
                    <button id="keep-paused" class="btn btn-secondary">Keep Paused</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('resume-timer').onclick = () => {
            overlay.remove();
            Timer.togglePause(this.state);
        };

        document.getElementById('keep-paused').onclick = () => {
            overlay.remove();
        };
    }
};