// state.js
const GymState = {
    routine: [],
    savedRoutines: JSON.parse(localStorage.getItem('savedRoutines')) || [],
    countdownBeepPlayed: false,
    currentTimer: null,
    repModeTimer: null,
    currentIndex: 0,
    isPaused: true,
    totalTime: 0,
    remainingTime: 0,
    isRepModeActive: false,
    workoutStartTime: 0,
    totalPausedTime: 0,
    pauseStartTime: 0,
    currentEditingIndex: -1,
    selectedRoutineIndex: -1,
    repStartTime: 0,
    repElapsedTime: 0,
    currentExerciseColor: '#4361ee',
    timerStartTime: 0,
    isTabVisible: true,
    tabHiddenTime: null,
    totalBackgroundTime: 0, // Add this to track time spent in background
    activeWorkoutTime: 0, // Time spent actively working out
    workoutTimer: null,
    workoutStartTime: 0,
    workoutElapsedTime: 0,
    workoutPausedTime: 0,
    workoutLastUpdate: 0,
    // PWA properties
    deferredPrompt: null,
    isAppInstalled: false,
    showInstallButton: false,

    resetAllState(state) {
        state.routine = [];
        state.countdownBeepPlayed = false;
        state.currentTimer = null;
        state.repModeTimer = null;
        state.currentIndex = 0;
        state.isPaused = true;
        state.totalTime = 0;
        state.remainingTime = 0;
        state.isRepModeActive = false;
        state.workoutStartTime = 0;
        state.totalPausedTime = 0;
        state.pauseStartTime = 0;
        state.currentEditingIndex = -1;
        state.selectedRoutineIndex = -1;
        state.repStartTime = 0;
        state.repElapsedTime = 0;
        state.currentExerciseColor = '#4361ee';
        state.timerStartTime = 0;
        state.isTabVisible = true;
        state.tabHiddenTime = null;
        state.totalBackgroundTime = 0;
        state.activeWorkoutTime = 0;
        state.workoutTimer = null;
        state.workoutStartTime = 0;
        state.workoutElapsedTime = 0;
        state.workoutPausedTime = 0;
        state.workoutLastUpdate = 0;
    },
    resetStateForTimer(state) {
        state.isPaused = true;
        state.currentIndex = 0;
        state.currentTimer = null;
        state.repModeTimer = null;
        state.remainingTime = 0;
        state.totalTime = 0;
        state.isRepModeActive = false;
        state.isTabVisible = true;
        state.tabHiddenTime = null;
        state.totalBackgroundTime = 0;
        state.activeWorkoutTime = 0;
        state.workoutTimer = null;
        state.workoutStartTime = 0;
        state.workoutElapsedTime = 0;
        state.workoutPausedTime = 0;
        state.workoutLastUpdate = 0;
    }
};

export default GymState;