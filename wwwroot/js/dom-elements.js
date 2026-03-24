// dom-elements.js
export const DOM = {
    // Timer elements
    timerDisplay: document.getElementById('timer'),
    currentExercise: document.getElementById('current-exercise'),
    currentTitle: document.getElementById('current-title'),
    currentMode: document.getElementById('current-mode'),
    currentTime: document.getElementById('current-time'),
    nextUpContent: document.getElementById('next-up-content'),
    progressBar: document.getElementById('progress-bar'),
    progressBarInner: document.getElementById('progress-bar'),
    repTimer: document.getElementById('rep-timer'),

    // Control buttons
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    exitBtn: document.getElementById('exit-btn'),

    // Finish screen buttons
    restartBtn: document.getElementById('restart-btn'),
    newWorkoutBtn: document.getElementById('new-workout-btn'),
    totalTimeDisplay: document.getElementById('total-time'),

    // Builder elements
    createRoutineHeading: document.querySelector('.section-title h3.clickable-heading'),
    routineItems: document.getElementById('routine-items'),
    saveRoutineBtn: document.getElementById('save-routine-btn'),
    workoutNameInput: document.getElementById('workout-name'),
    savedRoutinesList: document.getElementById('saved-routines-list'),
    savedCount: document.getElementById('saved-count'),

    // Views
    timerView: document.getElementById('timer-view'),
    builderView: document.getElementById('builder-view'),
    finishScreen: document.getElementById('finish-screen'),

    // Alert container
    alertContainer: document.getElementById('alert-container'),

    // Modals
    exerciseModal: new bootstrap.Modal(document.getElementById('exerciseModal')),
    breakModal: new bootstrap.Modal(document.getElementById('breakModal')),
    groupModal: new bootstrap.Modal(document.getElementById('groupModal')),

    // Modal titles
    exerciseModalTitle: document.getElementById('exercise-modal-title'),
    breakModalTitle: document.getElementById('break-modal-title'),
    groupModalTitle: document.getElementById('group-modal-title'),

    // Form elements
    exerciseModeSelect: document.getElementById('exercise-mode'),
    repsContainer: document.getElementById('reps-container'),
    timeContainer: document.getElementById('time-container'),

    // Import functionality elements
    importSheetBtn: document.getElementById('import-sheet-btn'),
    importSheetModal: new bootstrap.Modal(document.getElementById('importSheetModal')),
    sheetUrlInput: document.getElementById('sheet-url'),
    clearCurrentCheckbox: document.getElementById('clear-current'),
    importStatus: document.getElementById('import-status'),
    startImportBtn: document.getElementById('start-import-btn'),
    sheetRangeInput: document.getElementById('sheet-range'),

    installBtn: document.getElementById('installBtn'),
    checkUpdatesBtn: document.getElementById('check-updates-btn'),
    versionDisplay: document.getElementById('version-display')
};