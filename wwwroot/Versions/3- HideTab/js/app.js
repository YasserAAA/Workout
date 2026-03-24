// app.js
import GymState from './state.js';
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';
import { Timer } from './timer.js';
import { Workout } from './workout.js';
import { RoutineBuilder } from './routine-builder.js';
import { AudioPlayer } from './audio.js';
import { PWA } from './pwa.js'; 
import { VisibilityHandler } from './visibility-handler.js';
import { WorkoutTimer } from './workout-timer.js';

class GymTimerApp {
    constructor() {
        this.state = GymState;
        this.init();

        // Make instance globally accessible
        window.gymTimerApp = this;
    }

    init() {
        this.setupEventListeners();
        this.setupSwipeNavigation();
        RoutineBuilder.renderRoutine(this.state);
        RoutineBuilder.updateSavedRoutinesList(this.state);
        AudioPlayer.init(); 
        VisibilityHandler.init(this.state);
        PWA.init(this.state); 
        this.setupNetworkDetection();
    }

    setupNetworkDetection() {
        const networkStatus = document.createElement('div');
        networkStatus.className = 'network-status';
        networkStatus.id = 'networkStatus';
        document.body.appendChild(networkStatus);

        const updateNetworkStatus = () => {
            const statusElement = document.getElementById('networkStatus');
            if (navigator.onLine) {
                statusElement.className = 'network-status network-online';
                statusElement.title = 'Online';
            } else {
                statusElement.className = 'network-status network-offline';
                statusElement.title = 'Offline';
                Utils.showAlert('You are offline. Some features may not work.', 'warning');
            }
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();
    }

    setupEventListeners() {
        // Timer control buttons
        DOM.startBtn.addEventListener('click', () => this.startTimer());
        DOM.pauseBtn.addEventListener('click', () => Timer.togglePause(this.state));
        DOM.prevBtn.addEventListener('click', () => Workout.prevItem(this.state));
        DOM.nextBtn.addEventListener('click', () => Workout.nextItem(this.state));
        DOM.exitBtn.addEventListener('click', () => this.exitTimer());

        // Finish screen buttons
        DOM.restartBtn.addEventListener('click', () => this.restartTimer());
        DOM.newWorkoutBtn.addEventListener('click', () => this.newWorkout());

        // Exercise click for rep mode
        DOM.currentExercise.addEventListener('click', () => {
            if (this.state.isRepModeActive) {
                this.state.isRepModeActive = false;
                DOM.currentExercise.classList.remove('reps-mode');
                DOM.repTimer.classList.add('hidden');
                if (this.state.repModeTimer) {
                    clearInterval(this.state.repModeTimer);
                    this.state.repModeTimer = null;
                }
                Utils.playBeep();
                Workout.nextItem(this.state);
            }
        });

        // Setup routine builder event listeners
        RoutineBuilder.setupEventListeners(this.state);

        // Setup import functionality
        RoutineBuilder.setupImportFunctionality(this.state);

        DOM.checkUpdatesBtn.addEventListener('click', () => PWA.checkForUpdates());
    }

    setupSwipeNavigation() {
        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 50; // Minimum swipe distance

        DOM.currentExercise.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        DOM.currentExercise.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe right - previous item
                    Workout.prevItem(this.state);
                } else {
                    // Swipe left - next item
                    Workout.nextItem(this.state);
                }
            }
        }, false);
    }

    startTimer() {
        if (this.state.routine.length === 0 && this.state.selectedRoutineIndex < 0) {
            Utils.showAlert('Please add exercises to your routine first!', 'warning');
            return;
        }

        if (this.state.selectedRoutineIndex >= 0) {
            const selectedRoutine = this.state.savedRoutines[this.state.selectedRoutineIndex];
            this.state.routine = JSON.parse(JSON.stringify(selectedRoutine.items));
            DOM.workoutNameInput.value = selectedRoutine.name;
            RoutineBuilder.renderRoutine(this.state);
        }

        DOM.timerView.classList.remove('hidden');
        DOM.builderView.classList.add('hidden');
        DOM.finishScreen.classList.add('hidden');

        if (this.state.isPaused && this.state.currentTimer === null) {
            // Start a fresh workout
            this.state.workoutStartTime = Date.now();
            this.state.totalPausedTime = 0;
            this.state.currentIndex = 0;

            // Start the workout timer
            WorkoutTimer.start(this.state);

            Workout.startCurrentItem(this.state);
        } else if (this.state.isPaused) {
            // Resume an existing workout
            this.state.isPaused = false;

            // Resume the workout timer
            WorkoutTimer.resume(this.state);

            Utils.updateButtonStates(this.state);

            if (this.state.isRepModeActive && this.state.repModeTimer) {
                this.state.repStartTime = Date.now() - this.state.repElapsedTime;
                Timer.startRepTimer(this.state);
            } else if (this.state.currentTimer) {
                Timer.startCurrentItemTimer(this.state);
            }
        }
    }

    exitTimer() {
        if (confirm('Are you sure you want to exit the current workout?')) {
            this.resetTimer();
            DOM.timerView.classList.add('hidden');
            DOM.builderView.classList.remove('hidden');
            DOM.finishScreen.classList.add('hidden');
        }
    }

    restartTimer() {
        this.resetTimer();
        DOM.finishScreen.classList.add('hidden');
        this.startTimer();
    }

    newWorkout() {
        this.resetTimer();
        DOM.timerView.classList.add('hidden');
        DOM.builderView.classList.remove('hidden');
        DOM.finishScreen.classList.add('hidden');
        this.state.routine = [];
        RoutineBuilder.renderRoutine(this.state);
        DOM.workoutNameInput.value = '';
        this.state.selectedRoutineIndex = -1;
    }

    resetTimer() {
        this.state.resetStateForTimer(this.state);

        DOM.currentExercise.classList.remove('reps-mode');
        DOM.repTimer.classList.add('hidden');

        DOM.timerDisplay.textContent = '00:00';
        DOM.currentTitle.textContent = 'Ready to Workout';
        DOM.currentMode.textContent = '';
        DOM.currentTime.textContent = '';
        DOM.nextUp.textContent = 'Add exercises to your routine';
        DOM.progressBarInner.style.width = '0%';

        DOM.currentExercise.style.borderLeft = '5px solid #4361ee';
        DOM.progressBarInner.style.backgroundColor = '#4361ee';

        Utils.updateButtonStates(this.state);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GymTimerApp();
});