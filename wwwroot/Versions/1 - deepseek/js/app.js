// app.js
import GymState from './state.js';
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';
import { Timer } from './timer.js';
import { Workout } from './workout.js';
import { RoutineBuilder } from './routine-builder.js';
import { AudioPlayer } from './audio.js';

class GymTimerApp {
    constructor() {
        this.state = GymState;
        this.init();

        // Make instance globally accessible
        window.gymTimerApp = this;
    }

    init() {
        this.setupEventListeners();
        RoutineBuilder.renderRoutine(this.state);
        RoutineBuilder.updateSavedRoutinesList(this.state);
        AudioPlayer.init(); 
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

        // Save routine button
        //DOM.saveRoutineBtn.addEventListener('click', () => RoutineBuilder.saveRoutine(this.state));

        // Setup routine builder event listeners
        RoutineBuilder.setupEventListeners(this.state);

        // Setup import functionality
        RoutineBuilder.setupImportFunctionality(this.state);
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
            this.state.workoutStartTime = Date.now();
            this.state.totalPausedTime = 0;
            this.state.currentIndex = 0;
            Workout.startCurrentItem(this.state);
        } else if (this.state.isPaused) {
            this.state.isPaused = false;
            this.state.totalPausedTime += (Date.now() - this.state.pauseStartTime);
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
        this.state.isPaused = true;
        this.state.currentIndex = 0;
        this.state.currentTimer = null;
        this.state.repModeTimer = null;
        this.state.remainingTime = 0;
        this.state.totalTime = 0;
        this.state.isRepModeActive = false;
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