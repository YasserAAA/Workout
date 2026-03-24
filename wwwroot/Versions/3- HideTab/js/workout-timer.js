// workout-timer.js
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';

export const WorkoutTimer = {
    start(state) {
        if (state.workoutTimer) {
            cancelAnimationFrame(state.workoutTimer);
        }

        state.workoutStartTime = performance.now();
        state.workoutLastUpdate = state.workoutStartTime;
        state.workoutElapsedTime = 0;
        state.workoutPausedTime = 0;

        const updateWorkoutTime = (currentTime) => {
            if (!state.isPaused) {
                const delta = currentTime - state.workoutLastUpdate;
                state.workoutElapsedTime += delta;
                state.workoutLastUpdate = currentTime;

                // Update workout time display if needed
                // DOM.workoutTimeDisplay.textContent = Utils.formatTime(Math.floor(state.workoutElapsedTime / 1000));

                state.workoutTimer = requestAnimationFrame(updateWorkoutTime);
            }
        };

        state.workoutTimer = requestAnimationFrame(updateWorkoutTime);
    },

    pause(state) {
        if (state.workoutTimer) {
            cancelAnimationFrame(state.workoutTimer);
            state.workoutTimer = null;
        }

        // Always update the paused time when pausing
        const now = performance.now();
        state.workoutPausedTime += (now - state.workoutLastUpdate);
    },

    resume(state) {
        if (state.isPaused) return;

        state.workoutLastUpdate = performance.now();

        const updateWorkoutTime = (currentTime) => {
            if (!state.isPaused) {
                const delta = currentTime - state.workoutLastUpdate;
                state.workoutElapsedTime += delta;
                state.workoutLastUpdate = currentTime;

                state.workoutTimer = requestAnimationFrame(updateWorkoutTime);
            }
        };

        state.workoutTimer = requestAnimationFrame(updateWorkoutTime);
    },

    stop(state) {
        if (state.workoutTimer) {
            cancelAnimationFrame(state.workoutTimer);
            state.workoutTimer = null;
        }

        // Add any final time calculation if needed
        if (!state.isPaused) {
            const now = performance.now();
            state.workoutElapsedTime += (now - state.workoutLastUpdate);
        }

        return state.workoutElapsedTime;
    },

    getElapsedTime(state) {
        if (!state.isPaused && state.workoutLastUpdate) {
            const now = performance.now();
            return state.workoutElapsedTime + (now - state.workoutLastUpdate);
        }
        return state.workoutElapsedTime;
    }
};