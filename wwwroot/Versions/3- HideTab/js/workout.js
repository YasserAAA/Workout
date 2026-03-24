// workout.js
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';
import { Timer } from './timer.js';
import { WorkoutTimer } from './workout-timer.js';

export const Workout = {
    startCurrentItem(state) {
        if (state.currentIndex >= state.routine.length) {
            this.finishWorkout(state);
            return;
        }

        // Reset UI state
        state.isRepModeActive = false;
        DOM.currentExercise.classList.remove('reps-mode');
        DOM.repTimer.classList.add('hidden');

        const item = state.routine[state.currentIndex];
        state.isPaused = false;
        Utils.updateButtonStates(state);

        if (item.type === 'exercise') {
            state.currentExerciseColor = item.color;
            DOM.currentExercise.style.borderLeft = `5px solid ${item.color}`;
            DOM.progressBarInner.style.backgroundColor = item.color;

            if (item.mode === 'time') {
                this.handleTimeExercise(state, item);
            } else {
                this.handleRepExercise(state, item);
            }
        } else if (item.type === 'break') {
            this.handleBreak(state, item);
        } else if (item.type === 'group') {
            this.handleGroup(state, item);
        }

        this.updateNextUpText(state);
    },

    handleTimeExercise(state, item) {
        state.totalTime = item.time;
        state.remainingTime = item.time;
        state.isRepModeActive = false;
        state.timerStartTime = Date.now();

        DOM.currentTitle.textContent = item.name;
        DOM.currentTitle.style.color = item.color;
        DOM.currentMode.textContent = 'For Time';
        DOM.currentMode.className = 'badge badge-time';
        DOM.currentTime.textContent = `${Utils.formatTime(state.remainingTime)}`;

        Timer.updateTimerDisplay(state);
        Timer.startCurrentItemTimer(state);
    },

    handleRepExercise(state, item) {
        state.isRepModeActive = true;
        DOM.currentExercise.classList.add('reps-mode');
        DOM.repTimer.classList.remove('hidden');

        DOM.currentTitle.textContent = item.name;
        DOM.currentTitle.style.color = item.color;
        DOM.currentMode.textContent = 'For Reps - Click when done';
        DOM.currentMode.className = 'badge badge-reps';
        DOM.currentTime.textContent = `${item.reps} reps`;

        DOM.timerDisplay.textContent = '00:00';
        DOM.progressBarInner.style.width = '100%';

        state.repStartTime = Date.now();
        state.repElapsedTime = 0;
        Timer.startRepTimer(state);
    },

    handleBreak(state, item) {
        DOM.currentExercise.style.borderLeft = '5px solid #06d6a0';
        DOM.progressBarInner.style.backgroundColor = '#06d6a0';

        state.totalTime = item.time;
        state.remainingTime = item.time;
        state.isRepModeActive = false;
        state.timerStartTime = Date.now();

        DOM.currentTitle.textContent = 'Break';
        DOM.currentTitle.style.color = '';
        DOM.currentMode.textContent = 'Rest';
        DOM.currentTime.textContent = `${Utils.formatTime(state.remainingTime)}`;

        Timer.updateTimerDisplay(state);
        Timer.startCurrentItemTimer(state);
    },

    handleGroup(state, item) {
        DOM.currentExercise.style.borderLeft = '5px solid #ffd166';
        DOM.progressBarInner.style.backgroundColor = '#ffd166';

        DOM.currentTitle.textContent = item.name;
        DOM.currentTitle.style.color = '';
        DOM.currentMode.textContent = 'Group';
        DOM.currentTime.textContent = `${item.reps} rounds`;

        DOM.timerDisplay.textContent = '00:00';
        DOM.progressBarInner.style.width = '100%';

        setTimeout(() => {
            this.nextItem(state);
        }, 3000);
    },

    updateNextUpText(state) {
        const nextItems = [];

        // Get the next 2 items
        for (let i = 1; i <= 2; i++) {
            if (state.currentIndex + i < state.routine.length) {
                const nextItem = state.routine[state.currentIndex + i];
                nextItems.push(nextItem);
            }
        }

        if (nextItems.length > 0) {
            let nextUpHTML = '<h4><i class="fas fa-forward me-2"></i>Next Up</h4>';

            nextItems.forEach((item, index) => {
                if (item.type === 'exercise') {
                    nextUpHTML += `<p>${index + 1}. ${item.name} - ${item.mode === 'reps' ? `${item.reps} reps` : `${item.time} seconds`}</p>`;
                } else if (item.type === 'break') {
                    nextUpHTML += `<p>${index + 1}. Break - ${item.time} seconds</p>`;
                } else if (item.type === 'group') {
                    nextUpHTML += `<p>${index + 1}. ${item.name} - ${item.reps} rounds</p>`;
                }
            });

            DOM.nextUp.innerHTML = nextUpHTML;
        } else {
            DOM.nextUp.innerHTML = '<h4><i class="fas fa-forward me-2"></i>Next Up</h4><p>End of Routine</p>';
        }
    },

    prevItem(state) {
        if (state.currentIndex > 0) {
            this.clearTimers(state);
            state.currentIndex--;
            this.resetRepModeUI(state);
            this.startCurrentItem(state);
        }
    },

    nextItem(state) {
        if (state.currentIndex < state.routine.length - 1) {
            // Clear any running timers
            if (state.currentTimer) {
                cancelAnimationFrame(state.currentTimer);
                state.currentTimer = null;
            }
            if (state.repModeTimer) {
                clearInterval(state.repModeTimer);
                state.repModeTimer = null;
            }

            state.currentIndex++;

            // Reset rep mode UI elements
            this.resetRepModeUI(state);

            // Play appropriate beep based on item type
            const currentItem = state.routine[state.currentIndex - 1];
            if (currentItem?.type === 'exercise' && currentItem?.mode === 'reps') {
                Utils.playBeep(); // Single long beep for reps
            } else {
                Utils.playBeep(); // beep for the end of timer items and breaks
            }

            this.startCurrentItem(state);
        } else {
            // Clear timers before finishing
            this.clearTimers(state);

            // Play triple beep for routine completion
            Utils.playFinishBeep();

            this.finishWorkout(state);
        }
    },

    clearTimers(state) {
        if (state.currentTimer) {
            cancelAnimationFrame(state.currentTimer);
            state.currentTimer = null;
        }
        if (state.repModeTimer) {
            clearInterval(state.repModeTimer);
            state.repModeTimer = null;
        }
    },

    resetRepModeUI(state) {
        state.isRepModeActive = false;
        DOM.currentExercise.classList.remove('reps-mode');
        DOM.repTimer.classList.add('hidden');
    },

    finishWorkout(state) {
        this.clearTimers(state);

        // Stop the workout timer and get the elapsed time
        const totalWorkoutTime = WorkoutTimer.stop(state);

        const hours = Math.floor(totalWorkoutTime / 3600000);
        const minutes = Math.floor((totalWorkoutTime % 3600000) / 60000);
        const seconds = Math.floor((totalWorkoutTime % 60000) / 1000);

        DOM.totalTimeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        DOM.timerView.classList.add('hidden');
        DOM.finishScreen.classList.remove('hidden');

        DOM.startBtn.classList.add('hidden');
        DOM.pauseBtn.classList.add('hidden');
        DOM.prevBtn.classList.add('hidden');
        DOM.nextBtn.classList.add('hidden');
        DOM.exitBtn.classList.add('hidden');

        // Debug log to verify calculation
        console.log('Workout time calculation:', {
            totalMs: totalWorkoutTime,
            formatted: `${hours}:${minutes}:${seconds}`
        });
    }

};