// routine-builder.js
import { DOM } from './dom-elements.js';
import { Utils } from './utils.js';

// Map to track DOM elements by item ID
const domElementMap = new Map();

export const RoutineBuilder = {

    setupImportFunctionality(state) {
        DOM.importSheetBtn.addEventListener('click', () => {
            // Load saved URL and range from localStorage
            const savedSheetUrl = localStorage.getItem('lastSheetUrl') || '';
            const savedSheetRange = localStorage.getItem('lastSheetRange') || '';

            DOM.sheetUrlInput.value = savedSheetUrl;
            DOM.sheetRangeInput.value = savedSheetRange;
            DOM.importStatus.textContent = 'Ready to import...';
            DOM.importStatus.classList.add('hidden');
            DOM.importSheetModal.show();
        });

        DOM.startImportBtn.addEventListener('click', () => {
            this.importFromGoogleSheet(state);
        });
    },

    async importFromGoogleSheet(state) {
        const baseUrl = DOM.sheetUrlInput.value.trim();
        const range = DOM.sheetRangeInput.value.trim();
        const clearCurrent = DOM.clearCurrentCheckbox.checked;

        if (!baseUrl) {
            Utils.showAlert('Please enter a Google Sheet URL', 'warning');
            return;
        }

        // Save to localStorage for future use
        localStorage.setItem('lastSheetUrl', baseUrl);
        localStorage.setItem('lastSheetRange', range);

        const fullUrl = range ? `${baseUrl}&range=${range}` : baseUrl;

        DOM.importStatus.textContent = 'Parsing URL...';
        DOM.importStatus.classList.remove('hidden');

        try {
            const { sheetId, gid, range: parsedRange } = this.parseGoogleSheetUrl(fullUrl);

            if (!sheetId) {
                throw new Error('Invalid Google Sheet URL format');
            }

            DOM.importStatus.textContent = 'Fetching data from Google Sheets...';

            // Use CSV export endpoint
            const apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid || 0}${parsedRange ? `&range=${parsedRange}` : ''}`;

            console.log('Fetching from CSV endpoint:', apiUrl);

            const response = await fetch(apiUrl);
            const csvText = await response.text();

            if (!csvText) {
                throw new Error('No data returned from Google Sheets');
            }

            DOM.importStatus.textContent = 'Processing data...';

            // Process the CSV data
            const newRoutine = this.processCSVData(csvText);

            console.log('Processed routine items:', newRoutine.length, newRoutine);

            if (newRoutine.length === 0) {
                throw new Error('No valid exercise data found in the sheet');
            }

            // Update the routine
            if (clearCurrent) {
                state.routine = newRoutine;
            } else {
                state.routine = [...state.routine, ...newRoutine];
            }

            this.fullRenderRoutine(state);
            DOM.importSheetModal.hide();

            Utils.showAlert(`Successfully imported ${newRoutine.length} items from Google Sheet`, 'success');

        } catch (error) {
            console.error('Import error:', error);
            DOM.importStatus.textContent = `Error: ${error.message}`;
            Utils.showAlert(`Import failed: ${error.message}`, 'danger');
        }
    },

    parseGoogleSheetUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            let sheetId = null;

            // Handle both regular URLs and export URLs
            if (pathParts.includes('d')) {
                sheetId = pathParts[pathParts.indexOf('d') + 1];
            } else if (pathParts.includes('spreadsheets')) {
                sheetId = pathParts[pathParts.indexOf('spreadsheets') + 2];
            }

            let gid = null;
            let range = null;

            // Extract gid and range from query params
            if (urlObj.search) {
                const searchParams = new URLSearchParams(urlObj.search);
                gid = searchParams.get('gid');
                range = searchParams.get('range');
            }

            // Also check hash for parameters
            if (urlObj.hash) {
                const hashParams = new URLSearchParams(urlObj.hash.replace('#', ''));
                gid = hashParams.get('gid') || gid;
                range = hashParams.get('range') || range;
            }

            console.log('Parsed URL:', { sheetId, gid, range });
            return { sheetId, gid, range };
        } catch (error) {
            throw new Error('Invalid URL format');
        }
    },

    processCSVData(csvText) {
        const routine = [];
        const lines = csvText.split('\n');

        console.log('CSV lines:', lines.length, lines);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // DEBUG: Log each line
            console.log(`Line ${i}: "${line}"`);

            if (!line) {
                console.log(`Skipping empty line ${i}`);
                continue;
            }

            // Simple CSV parsing (for single column data)
            const cellValue = line.replace(/^"|"$/g, ''); // Remove quotes if present

            console.log(`Line ${i} value:`, cellValue);

            if (!cellValue && cellValue !== '0') {
                console.log(`Skipping line ${i} - no value`);
                continue;
            }

            // Check if this is a new item (sets x reps format or time format)
            const setsRepsMatch = cellValue.match(/(\d+)x(\d+)/i);
            const timeMatch = cellValue.match(/(\d+):(\d+)/);
            const isWarming = cellValue.toLowerCase().includes('warm');

            console.log(`Line ${i} processing:`, cellValue, {
                setsRepsMatch,
                timeMatch,
                isWarming
            });

            if (setsRepsMatch) {
                // Exercise with sets and reps
                const sets = parseInt(setsRepsMatch[1]);
                const reps = parseInt(setsRepsMatch[2]);

                // Get exercise name from next line (if available)
                let exerciseName = 'Imported Exercise';
                if (i + 2 < lines.length) {
                    const nextLine = lines[i + 2].trim();
                    if (nextLine) {
                        exerciseName = nextLine.replace(/^"|"$/g, '');
                        console.log(`Found exercise name: ${exerciseName} for line ${i}`);
                        i++; // Skip the name line
                    }
                }

                // Add multiple items for sets
                for (let s = 0; s < sets; s++) {
                    routine.push({
                        type: 'exercise',
                        name: exerciseName,
                        color: '#ef476f',
                        mode: 'reps',
                        reps: reps,
                        time: 0,
                        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                }

                console.log(`Added ${sets} sets of ${reps} reps for ${exerciseName}`);

            } else if (timeMatch) {
                // Break with time
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                const totalSeconds = (minutes * 60) + seconds;

                routine.push({
                    type: 'break',
                    time: totalSeconds,
                    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });

                console.log(`Added break: ${totalSeconds} seconds`);

            } else if (isWarming) {
                // Warming exercise 
                let warmingName = 'Warming';
                if (cellValue.length > 7) {
                    warmingName = cellValue.replace(/warm:/i, '').trim() || warmingName;
                    console.log(`Custom warming name: ${warmingName}`);
                }
                routine.push({
                    type: 'exercise',
                    name: warmingName,
                    color: '#fb5607',
                    mode: 'reps',
                    reps: 1,
                    time: 0,
                    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });

                console.log('Added warming exercise');
            } else {
                console.log(`Line ${i} didn't match any pattern: ${cellValue}`);
            }
        }

        console.log('Final routine:', routine);
        return routine;
    },

    processSheetData(rows) {
        const routine = [];
        let currentItem = null;

        for (let i = 1; i < rows.length; i++) { // Start from row 1 (skip header)
            const row = rows[i];
            if (!row.c || row.c.length === 0) continue;

            const firstCell = row.c[0] ? row.c[0].v : null;

            if (!firstCell) continue;

            // Check if this is a new item (sets x reps format or time format)
            if (typeof firstCell === 'string') {
                const setsRepsMatch = firstCell.match(/(\d+)x(\d+)/i);
                const timeMatch = firstCell.match(/(\d+):(\d+)/);
                const isWarming = firstCell.toLowerCase().includes('warming');

                if (setsRepsMatch) {
                    // Exercise with sets and reps
                    const sets = parseInt(setsRepsMatch[1]);
                    const reps = parseInt(setsRepsMatch[2]);

                    // Get exercise name from next row (if available)
                    let exerciseName = 'Imported Exercise';
                    if (i + 1 < rows.length && rows[i + 1].c && rows[i + 1].c[0] && rows[i + 1].c[0].v) {
                        exerciseName = rows[i + 1].c[0].v;
                        i++; // Skip the name row
                    }

                    // Add multiple items for sets
                    for (let s = 0; s < sets; s++) {
                        routine.push({
                            type: 'exercise',
                            name: exerciseName,
                            color: '#4361ee',
                            mode: 'reps',
                            reps: reps,
                            time: 0,
                            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        });
                    }

                } else if (timeMatch) {
                    // Break with time
                    const minutes = parseInt(timeMatch[1]);
                    const seconds = parseInt(timeMatch[2]);
                    const totalSeconds = (minutes * 60) + seconds;

                    routine.push({
                        type: 'break',
                        time: totalSeconds,
                        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });

                } else if (isWarming) {
                    // Warming exercise
                    routine.push({
                        type: 'exercise',
                        name: 'Warming',
                        color: '#fb5607',
                        mode: 'reps',
                        reps: 1,
                        time: 0,
                        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                }
            }
        }

        return routine;
    },

    // Add item to routine with ID generation
    addItemToRoutine(state, item) {
        // Generate unique ID if not already present
        if (!item.id) {
            item.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        state.routine.push(item);
        return item.id;
    },

    // Render routine with surgical updates
    renderRoutine(state, options = {}) {
        const { addedItemId, updatedItemId, deletedItemId } = options;

        // If no specific changes, do full render (first load)
        if (!addedItemId && !updatedItemId && !deletedItemId) {
            return this.fullRenderRoutine(state);
        }

        // Handle specific surgical updates
        if (deletedItemId) {
            this.surgicalDeleteItem(deletedItemId);
        }

        if (updatedItemId) {
            this.surgicalUpdateItem(state, updatedItemId);
        }

        if (addedItemId) {
            this.surgicalAddItem(state, addedItemId);
        }

        // Show placeholder if routine is empty
        if (state.routine.length === 0) {
            DOM.routineItems.innerHTML = '<p class="text-center text-muted py-3">Your routine items will appear here</p>';
        }

        this.enableDragAndDrop(state);
    },

    // Full render for initial load
    fullRenderRoutine(state) {
        // Clear the DOM map
        domElementMap.clear();

        if (state.routine.length === 0) {
            DOM.routineItems.innerHTML = '<p class="text-center text-muted py-3">Your routine items will appear here</p>';
            return;
        }

        DOM.routineItems.innerHTML = '';
        state.routine.forEach((item, index) => {
            const element = this.createRoutineElement(item, index, state);
            DOM.routineItems.appendChild(element);
            // Store in DOM map
            domElementMap.set(item.id, element);
        });

        this.enableDragAndDrop(state);
    },

    // Surgical delete: remove only the specific element
    surgicalDeleteItem(itemId) {
        const element = domElementMap.get(itemId);
        if (element) {
            element.remove();
            domElementMap.delete(itemId);
        }
    },

    // Surgical update: replace only the specific element
    surgicalUpdateItem(state, itemId) {
        const index = state.routine.findIndex(item => item.id === itemId);
        if (index === -1) return;

        const item = state.routine[index];
        const oldElement = domElementMap.get(itemId);
        const newElement = this.createRoutineElement(item, index, state);

        if (oldElement && oldElement.parentNode) {
            oldElement.parentNode.replaceChild(newElement, oldElement);
        }

        domElementMap.set(itemId, newElement);
    },

    // Surgical add: append only the new element
    surgicalAddItem(state, itemId) {
        const item = state.routine.find(item => item.id === itemId);
        const index = state.routine.findIndex(item => item.id === itemId);

        if (item && index !== -1) {
            const element = this.createRoutineElement(item, index, state);
            DOM.routineItems.appendChild(element);
            domElementMap.set(itemId, element);
        }
    },

    // Create routine element
    createRoutineElement(item, index, state) {
        const div = document.createElement('div');
        div.dataset.index = index;
        div.dataset.itemId = item.id;
        div.draggable = true;

        if (item.type === 'exercise') {
            div.className = 'exercise-item';
            div.innerHTML = `
            <div class="color-preview" style="background-color: ${item.color}"></div>
            <strong>${item.name}</strong>
            <span class="mode-badge ${item.mode === 'reps' ? 'badge-reps' : 'badge-time'}">
                ${item.mode === 'reps' ? `${item.reps} reps` : `${item.time} seconds`}
            </span>
            <div class="ms-auto">
                <button class="btn btn-sm btn-outline-info edit-btn me-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        } else if (item.type === 'break') {
            div.className = 'break-item';
            div.innerHTML = `
            <i class="fas fa-clock me-2"></i>
            <strong>Break</strong>
            <span class="ms-2">${item.time} seconds</span>
            <div class="ms-auto">
                <button class="btn btn-sm btn-outline-info edit-btn me-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        } else if (item.type === 'group') {
            div.className = 'group-item';
            div.innerHTML = `
            <i class="fas fa-object-group me-2"></i>
            <strong>${item.name}</strong>
            <span class="ms-2">${item.reps} rounds</span>
            <div class="ms-auto">
                <button class="btn btn-sm btn-outline-info edit-btn me-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        }

        // Add delete functionality - FIXED VERSION
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Use the item ID from the dataset instead of index
            const itemId = div.dataset.itemId;
            const itemIndex = state.routine.findIndex(item => item.id === itemId);

            if (itemIndex !== -1) {
                state.routine.splice(itemIndex, 1);
                this.renderRoutine(state, { deletedItemId: itemId });
            }
        });

        // Add edit functionality - Also should use ID instead of index
        const editBtn = div.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Use the item ID from the dataset instead of index
            const itemId = div.dataset.itemId;
            const itemIndex = state.routine.findIndex(item => item.id === itemId);

            if (itemIndex !== -1) {
                this.editItem(state, itemIndex, state.routine[itemIndex]);
            }
        });

        return div;

    },

    // Edit an item
    editItem(state, index, item) {
        state.currentEditingIndex = index;

        if (item.type === 'exercise') {
            DOM.exerciseModalTitle.textContent = 'Edit Exercise';
            document.getElementById('exercise-name').value = item.name;
            document.getElementById('exercise-color').value = item.color;
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.dataset.color === item.color) {
                    opt.classList.add('selected');
                }
            });
            document.getElementById('exercise-mode').value = item.mode;
            document.getElementById('exercise-reps').value = item.reps;
            document.getElementById('exercise-time').value = item.time;

            if (item.mode === 'reps') {
                DOM.repsContainer.classList.remove('d-none');
                DOM.timeContainer.classList.add('d-none');
            } else {
                DOM.repsContainer.classList.add('d-none');
                DOM.timeContainer.classList.remove('d-none');
            }

            // Remove any existing click handlers
            const saveExerciseBtn = document.getElementById('save-exercise-btn');
            saveExerciseBtn.replaceWith(saveExerciseBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-exercise-btn');

            newSaveBtn.onclick = () => {
                const name = document.getElementById('exercise-name').value || 'Unnamed Exercise';
                const color = document.getElementById('exercise-color').value;
                const mode = document.getElementById('exercise-mode').value;
                const reps = document.getElementById('exercise-reps').value;
                const time = document.getElementById('exercise-time').value;

                const exercise = {
                    ...item,
                    name,
                    color,
                    mode,
                    reps: mode === 'reps' ? parseInt(reps) : 0,
                    time: mode === 'time' ? parseInt(time) : 0
                };

                state.routine[index] = exercise;
                this.renderRoutine(state, { updatedItemId: item.id });
                DOM.exerciseModal.hide();
                Utils.showAlert('Exercise updated successfully!', 'success');
            };

            DOM.exerciseModal.show();

        } else if (item.type === 'break') {
            DOM.breakModalTitle.textContent = 'Edit Break';
            document.getElementById('break-time').value = item.time;

            // Remove any existing click handlers
            const saveBreakBtn = document.getElementById('save-break-btn');
            saveBreakBtn.replaceWith(saveBreakBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-break-btn');

            newSaveBtn.onclick = () => {
                const time = document.getElementById('break-time').value;

                const breakItem = {
                    ...item,
                    time: parseInt(time)
                };

                state.routine[index] = breakItem;
                this.renderRoutine(state, { updatedItemId: item.id });
                DOM.breakModal.hide();
                Utils.showAlert('Break updated successfully!', 'success');
            };

            DOM.breakModal.show();

        } else if (item.type === 'group') {
            DOM.groupModalTitle.textContent = 'Edit Exercise Group';
            document.getElementById('group-name').value = item.name;
            document.getElementById('group-reps').value = item.reps;

            // Remove any existing click handlers
            const saveGroupBtn = document.getElementById('save-group-btn');
            saveGroupBtn.replaceWith(saveGroupBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-group-btn');

            newSaveBtn.onclick = () => {
                const name = document.getElementById('group-name').value || 'Exercise Group';
                const reps = document.getElementById('group-reps').value;

                const group = {
                    ...item,
                    name,
                    reps: parseInt(reps)
                };

                state.routine[index] = group;
                this.renderRoutine(state, { updatedItemId: item.id });
                DOM.groupModal.hide();
                Utils.showAlert('Group updated successfully!', 'success');
            };

            DOM.groupModal.show();
        }
    },

    // Enable drag and drop functionality
    enableDragAndDrop(state) {
        const items = DOM.routineItems.querySelectorAll('[draggable="true"]');
        let draggedItem = null;

        function handleDragStart(e) {
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.itemId);
        }

        function handleDragOver(e) {
            e.preventDefault();
            return false;
        }

        function handleDragEnter(e) {
            this.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            this.classList.remove('drag-over');
        }

        function handleDrop(e) {
            e.stopPropagation();
            this.classList.remove('drag-over');

            if (draggedItem !== this) {
                const fromItemId = draggedItem.dataset.itemId;
                const toItemId = this.dataset.itemId;

                const fromIndex = state.routine.findIndex(item => item.id === fromItemId);
                const toIndex = state.routine.findIndex(item => item.id === toItemId);

                if (fromIndex !== -1 && toIndex !== -1) {
                    // Rearrange array
                    const item = state.routine.splice(fromIndex, 1)[0];
                    state.routine.splice(toIndex, 0, item);

                    // For reordering, do a full re-render
                    this.fullRenderRoutine(state);
                }
            }
            return false;
        }

        function handleDragEnd(e) {
            this.classList.remove('dragging');
            const items = DOM.routineItems.querySelectorAll('[draggable="true"]');
            items.forEach(item => item.classList.remove('drag-over'));
        }

        items.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    },

    // Save routine
    saveRoutine(state) {
        if (state.routine.length === 0) {
            Utils.showAlert('Please add exercises to your routine first!', 'warning');
            return;
        }

        const name = DOM.workoutNameInput.value || 'Unnamed Routine';

        const routineData = {
            name,
            items: JSON.parse(JSON.stringify(state.routine))
        };

        // Check if we're editing an existing routine
        if (state.selectedRoutineIndex >= 0) {
            state.savedRoutines[state.selectedRoutineIndex] = routineData;
            Utils.showAlert(`Routine "${name}" updated successfully!`, 'success');
        } else {
            state.savedRoutines.push(routineData);
            Utils.showAlert(`Routine "${name}" saved successfully!`, 'success');
        }

        // Save to localStorage
        localStorage.setItem('savedRoutines', JSON.stringify(state.savedRoutines));

        this.updateSavedRoutinesList(state);
    },

    // Update saved routines list
    updateSavedRoutinesList(state) {
        if (state.savedRoutines.length === 0) {
            DOM.savedRoutinesList.innerHTML = '<p class="text-center text-muted py-3">No saved routines yet</p>';
            DOM.savedCount.textContent = '0';
            return;
        }

        DOM.savedCount.textContent = state.savedRoutines.length;
        DOM.savedRoutinesList.innerHTML = '';
        state.savedRoutines.forEach((routine, index) => {
            const div = document.createElement('div');
            div.className = 'routine-card';
            div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h5>${routine.name}</h5>
                <span class="badge bg-primary">${routine.items.length} items</span>
            </div>
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-success select-btn me-2">
                    <i class="fas fa-play me-1"></i>Start
                </button>
                <button class="btn btn-sm btn-outline-primary edit-routine-btn me-2">
                    <i class="fas fa-edit me-1"></i>Edit
                </button>
                <button class="btn btn-sm btn-outline-danger delete-routine-btn">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        `;

            // Add select functionality
            const selectBtn = div.querySelector('.select-btn');
            selectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.selectedRoutineIndex = index;
                const selectedRoutine = state.savedRoutines[index];
                state.routine = JSON.parse(JSON.stringify(selectedRoutine.items));
                DOM.workoutNameInput.value = selectedRoutine.name;
                this.fullRenderRoutine(state);

                // Start the timer
                window.gymTimerApp.startTimer();
            });

            // Add edit functionality
            const editBtn = div.querySelector('.edit-routine-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.selectedRoutineIndex = index;
                const selectedRoutine = state.savedRoutines[index];
                state.routine = JSON.parse(JSON.stringify(selectedRoutine.items));
                DOM.workoutNameInput.value = selectedRoutine.name;
                this.fullRenderRoutine(state);
                Utils.showAlert(`Editing "${selectedRoutine.name}"`, 'info');
            });

            // Add delete functionality
            const deleteBtn = div.querySelector('.delete-routine-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${routine.name}"?`)) {
                    state.savedRoutines.splice(index, 1);
                    localStorage.setItem('savedRoutines', JSON.stringify(state.savedRoutines));
                    this.updateSavedRoutinesList(state);
                    Utils.showAlert(`Routine "${routine.name}" deleted`, 'danger');

                    if (state.selectedRoutineIndex === index) {
                        state.selectedRoutineIndex = -1;
                    }
                }
            });

            DOM.savedRoutinesList.appendChild(div);
        });
    },

    // Setup event listeners for routine builder
    setupEventListeners(state) {
        // Make "Create Routine" heading clickable
        if (DOM.createRoutineHeading) {
            DOM.createRoutineHeading.addEventListener('click', () => {
                if (window.gymTimerApp && typeof window.gymTimerApp.newWorkout === 'function') {
                    window.gymTimerApp.newWorkout();
                } else {
                    state.routine = [];
                    state.selectedRoutineIndex = -1;
                    DOM.workoutNameInput.value = '';
                    this.fullRenderRoutine(state);
                    Utils.showAlert('New workout routine created', 'info');
                }
            });
        }

        // Add exercise button
        document.getElementById('add-exercise-btn').addEventListener('click', () => {
            DOM.exerciseModalTitle.textContent = 'Add Exercise';
            document.getElementById('exercise-name').value = '';
            document.getElementById('exercise-color').value = '#4361ee';
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            document.querySelector('.color-option[data-color="#4361ee"]').classList.add('selected');
            document.getElementById('exercise-mode').value = 'reps';
            document.getElementById('exercise-reps').value = '1';
            document.getElementById('exercise-time').value = '30';
            DOM.repsContainer.classList.remove('d-none');
            DOM.timeContainer.classList.add('d-none');

            state.currentEditingIndex = -1;

            // Remove any existing click handlers
            const saveExerciseBtn = document.getElementById('save-exercise-btn');
            saveExerciseBtn.replaceWith(saveExerciseBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-exercise-btn');

            newSaveBtn.onclick = () => {
                const name = document.getElementById('exercise-name').value || 'Unnamed Exercise';
                const color = document.getElementById('exercise-color').value;
                const mode = document.getElementById('exercise-mode').value;
                const reps = document.getElementById('exercise-reps').value;
                const time = document.getElementById('exercise-time').value;

                const exercise = {
                    type: 'exercise',
                    name,
                    color,
                    mode,
                    reps: mode === 'reps' ? parseInt(reps) : 0,
                    time: mode === 'time' ? parseInt(time) : 0
                };

                const newItemId = this.addItemToRoutine(state, exercise);
                this.renderRoutine(state, { addedItemId: newItemId });
                DOM.exerciseModal.hide();
                Utils.showAlert('Exercise added successfully!', 'success');
            };

            DOM.exerciseModal.show();
        });

        // Add break button
        document.getElementById('add-break-btn').addEventListener('click', () => {
            DOM.breakModalTitle.textContent = 'Add Break';
            document.getElementById('break-time').value = '60';
            state.currentEditingIndex = -1;

            // Remove any existing click handlers
            const saveBreakBtn = document.getElementById('save-break-btn');
            saveBreakBtn.replaceWith(saveBreakBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-break-btn');

            newSaveBtn.onclick = () => {
                const time = document.getElementById('break-time').value;

                const breakItem = {
                    type: 'break',
                    time: parseInt(time)
                };

                const newItemId = this.addItemToRoutine(state, breakItem);
                this.renderRoutine(state, { addedItemId: newItemId });
                DOM.breakModal.hide();
                Utils.showAlert('Break added successfully!', 'success');
            };

            DOM.breakModal.show();
        });

        // Add group button
        document.getElementById('add-group-btn').addEventListener('click', () => {
            DOM.groupModalTitle.textContent = 'Add Exercise Group';
            document.getElementById('group-name').value = '';
            document.getElementById('group-reps').value = '3';
            state.currentEditingIndex = -1;

            // Remove any existing click handlers
            const saveGroupBtn = document.getElementById('save-group-btn');
            saveGroupBtn.replaceWith(saveGroupBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-group-btn');

            newSaveBtn.onclick = () => {
                const name = document.getElementById('group-name').value || 'Exercise Group';
                const reps = document.getElementById('group-reps').value;

                const group = {
                    type: 'group',
                    name,
                    reps: parseInt(reps)
                };

                const newItemId = this.addItemToRoutine(state, group);
                this.renderRoutine(state, { addedItemId: newItemId });
                DOM.groupModal.hide();
                Utils.showAlert('Group added successfully!', 'success');
            };

            DOM.groupModal.show();
        });

        // Save routine button
        DOM.saveRoutineBtn.addEventListener('click', () => {
            this.saveRoutine(state);
        });

        // Mode switching
        DOM.exerciseModeSelect.addEventListener('change', function () {
            if (this.value === 'reps') {
                DOM.repsContainer.classList.remove('d-none');
                DOM.timeContainer.classList.add('d-none');
            } else {
                DOM.repsContainer.classList.add('d-none');
                DOM.timeContainer.classList.remove('d-none');
            }
        });

        // Color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function () {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('exercise-color').value = this.dataset.color;
            });
        });
    }
};