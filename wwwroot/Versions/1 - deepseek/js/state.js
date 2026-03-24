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
    timerStartTime: 0
};

export default GymState;