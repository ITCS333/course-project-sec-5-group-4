
let weeklyCourses = [];

// --- DOM Elements ---
const courseForm = document.querySelector('#week-form');
const tableBody = document.querySelector('#weeks-tbody');
const submitButton = document.querySelector('#add-week');

// --- Helper: Build Table Row ---
function buildCourseRow(course) {
    const newRow = document.createElement('tr');

    // Course title column
    const titleColumn = document.createElement('td');
    titleColumn.innerText = course.title;
    newRow.appendChild(titleColumn);

    // Start date column
    const dateColumn = document.createElement('td');
    dateColumn.innerText = course.start_date;
    newRow.appendChild(dateColumn);

    // Description column
    const descColumn = document.createElement('td');
    descColumn.innerText = course.description;
    newRow.appendChild(descColumn);

    // Actions column with buttons
    const actionColumn = document.createElement('td');

    const editButton = document.createElement('button');
    editButton.innerText = 'Edit';
    editButton.className = 'edit-btn btn btn-sm btn-warning me-2';
    editButton.setAttribute('data-id', course.id);
    
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.className = 'delete-btn btn btn-sm btn-danger';
    deleteButton.setAttribute('data-id', course.id);

    actionColumn.appendChild(editButton);
    actionColumn.appendChild(deleteButton);
    newRow.appendChild(actionColumn);

    return newRow;
}

// --- Render All Rows ---
function displayAllRows() {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    weeklyCourses.forEach(course => {
        tableBody.appendChild(buildCourseRow(course));
    });
}

// --- Create New Course ---
async function insertNewCourse(event) {
    event.preventDefault();

    const courseTitle = document.querySelector('#week-title').value.trim();
    const startingDate = document.querySelector('#week-start-date').value;
    const courseDesc = document.querySelector('#week-description').value.trim();
    const resourceLinks = document.querySelector('#week-links').value
        .split('\n')
        .map(item => item.trim())
        .filter(item => item !== '');

    const existingEditId = submitButton.dataset.editId;

    if (existingEditId) {
        await modifyExistingCourse(parseInt(existingEditId), {
            title: courseTitle,
            start_date: startingDate,
            description: courseDesc,
            links: resourceLinks
        });
        return;
    }

    try {
        const apiResponse = await fetch('./api/index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: courseTitle,
                start_date: startingDate,
                description: courseDesc,
                links: resourceLinks
            })
        });
        
        const responseData = await apiResponse.json();
        
        if (responseData.success) {
            weeklyCourses.push({
                id: responseData.id,
                title: courseTitle,
                start_date: startingDate,
                description: courseDesc,
                links: resourceLinks
            });
            displayAllRows();
            courseForm.reset();
        } else {
            alert('Unable to add course. Please try again.');
        }
    } catch (error) {
        console.error('Insert operation failed:', error);
        alert('Network error occurred.');
    }
}

// --- Update Existing Course ---
async function modifyExistingCourse(courseId, updatedData) {
    try {
        const apiResponse = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: courseId, ...updatedData })
        });
        
        const responseData = await apiResponse.json();
        
        if (responseData.success) {
            const targetIndex = weeklyCourses.findIndex(item => item.id === courseId);
            if (targetIndex !== -1) {
                weeklyCourses[targetIndex] = { id: courseId, ...updatedData };
            }
            displayAllRows();
            courseForm.reset();
            submitButton.innerText = 'Add Week';
            delete submitButton.dataset.editId;
        } else {
            alert('Update failed. Please try again.');
        }
    } catch (error) {
        console.error('Update operation failed:', error);
        alert('Network error occurred.');
    }
}

// --- Handle Edit / Delete Actions ---
async function processTableActions(event) {
    const clickedElement = event.target;
    const recordId = parseInt(clickedElement.dataset.id);

    if (clickedElement.classList.contains('delete-btn')) {
        const userConfirmed = confirm('Delete this week? This action cannot be undone.');
        if (!userConfirmed) return;
        
        try {
            const apiResponse = await fetch(`./api/index.php?id=${recordId}`, { method: 'DELETE' });
            const responseData = await apiResponse.json();
            
            if (responseData.success) {
                weeklyCourses = weeklyCourses.filter(item => item.id !== recordId);
                displayAllRows();
            } else {
                alert('Deletion failed.');
            }
        } catch (error) {
            console.error('Delete operation failed:', error);
            alert('Network error occurred.');
        }
    } 
    else if (clickedElement.classList.contains('edit-btn')) {
        const targetCourse = weeklyCourses.find(item => item.id === recordId);
        if (!targetCourse) return;

        document.querySelector('#week-title').value = targetCourse.title;
        document.querySelector('#week-start-date').value = targetCourse.start_date;
        document.querySelector('#week-description').value = targetCourse.description;
        document.querySelector('#week-links').value = targetCourse.links.join('\n');

        submitButton.innerText = 'Update Week';
        submitButton.dataset.editId = recordId;
    }
}

// --- Initial Load ---
async function startupInitialization() {
    try {
        const apiResponse = await fetch('./api/index.php');
        const responseData = await apiResponse.json();
        
        if (responseData.success) {
            weeklyCourses = responseData.data;
            displayAllRows();
        } else {
            alert('Failed to load course data.');
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Could not connect to server.');
    }

    courseForm.addEventListener('submit', insertNewCourse);
    tableBody.addEventListener('click', processTableActions);
}

// --- Start Application ---
startupInitialization();

/*
  Requirement: Make the "Manage Weekly Breakdown" page interactive.

  Instructions:
  1. This file is already linked to `admin.html` via:
         <script src="admin.js" defer></script>

  2. In `admin.html`:
     - The form has id="week-form".
     - The submit button has id="add-week".
     - The <tbody> has id="weeks-tbody".
     - Columns rendered per row: Week Title | Start Date | Description | Actions.

  3. Implement the TODOs below.

  API base URL: ./api/index.php
  All requests and responses use JSON.
  Successful list response shape: { success: true, data: [ ...week objects ] }
  Each week object shape:
    {
      id:          number,   // integer primary key from the weeks table
      title:       string,
      start_date:  string,   // "YYYY-MM-DD"
      description: string,
      links:       string[]  // decoded array of URL strings
    }
*/

// --- Global Data Store ---
// Holds the weeks currently displayed in the table.
let weeks = [];

// --- Element Selections ---
// TODO: Select the week form by id 'week-form'.

// TODO: Select the weeks table body by id 'weeks-tbody'.

// --- Functions ---

/**
 * TODO: Implement createWeekRow.
 *
 * Parameters:
 *   week — one week object with shape:
 *     { id, title, start_date, description, links }
 *
 * Returns a <tr> element with four <td>s:
 *   1. title
 *   2. start_date  (the "YYYY-MM-DD" string from the weeks table)
 *   3. description
 *   4. Actions — two buttons:
 *        <button class="edit-btn"   data-id="{id}">Edit</button>
 *        <button class="delete-btn" data-id="{id}">Delete</button>
 *      The data-id holds the integer primary key from the weeks table.
 */
function createWeekRow(week) {
  // ... your implementation here ...
}

/**
 * TODO: Implement renderTable.
 *
 * It should:
 * 1. Clear the weeks table body (set innerHTML to "").
 * 2. Loop through the global `weeks` array.
 * 3. For each week, call createWeekRow(week) and append the <tr>
 *    to the table body.
 */
function renderTable() {
  // ... your implementation here ...
}

/**
 * TODO: Implement handleAddWeek (async).
 *
 * This is the event handler for the form's 'submit' event.
 * It should:
 * 1. Call event.preventDefault().
 * 2. Read values from:
 *      - #week-title       → title (string)
 *      - #week-start-date  → start_date (string, "YYYY-MM-DD")
 *      - #week-description → description (string)
 *      - #week-links       → split by newlines (\n) and filter empty
 *                            strings to produce a links array.
 * 3. Check if the submit button (#add-week) has a data-edit-id attribute.
 *    - If it does, call handleUpdateWeek() with that id and the field values.
 *    - If it does not, send a POST to './api/index.php' with the body:
 *        { title, start_date, description, links }
 *      On success (result.success === true):
 *        - Add the new week (with the id from result.id) to the global
 *          `weeks` array.
 *        - Call renderTable().
 *        - Reset the form.
 */
async function handleAddWeek(event) {
  // ... your implementation here ...
}

/**
 * TODO: Implement handleUpdateWeek (async).
 *
 * Parameters:
 *   id     — the integer primary key of the week being edited.
 *   fields — object with { title, start_date, description, links }.
 *
 * It should:
 * 1. Send a PUT to './api/index.php' with the body:
 *      { id, title, start_date, description, links }
 * 2. On success:
 *    - Update the matching entry in the global `weeks` array.
 *    - Call renderTable().
 *    - Reset the form.
 *    - Restore the submit button text to "Add Week" and remove
 *      its data-edit-id attribute.
 */
async function handleUpdateWeek(id, fields) {
  // ... your implementation here ...
}

/**
 * TODO: Implement handleTableClick (async).
 *
 * This is a delegated click listener on the weeks table body.
 * It should:
 * 1. If event.target has class "delete-btn":
 *    a. Read the integer id from event.target.dataset.id.
 *    b. Send a DELETE to './api/index.php?id=<id>'.
 *    c. On success, remove the week from the global `weeks` array
 *       and call renderTable().
 *
 * 2. If event.target has class "edit-btn":
 *    a. Read the integer id from event.target.dataset.id.
 *    b. Find the matching week in the global `weeks` array.
 *    c. Populate the form fields (#week-title, #week-start-date,
 *       #week-description, #week-links) with the week's data.
 *       For #week-links, join the links array with newlines (\n).
 *    d. Change the submit button (#add-week) text to "Update Week"
 *       and set its data-edit-id attribute to the week's id.
 */
async function handleTableClick(event) {
  // ... your implementation here ...
}

/**
 * TODO: Implement loadAndInitialize (async).
 *
 * It should:
 * 1. Send a GET to './api/index.php'.
 *    Response shape: { success: true, data: [ ...week objects ] }
 * 2. Store the data array in the global `weeks` variable.
 * 3. Call renderTable() to populate the table.
 * 4. Attach the 'submit' event listener to the week form
 *    (calls handleAddWeek).
 * 5. Attach a 'click' event listener to the weeks table body
 *    (calls handleTableClick — event delegation for edit and delete).
 */
async function loadAndInitialize() {
  // ... your implementation here ...
}

// --- Initial Page Load ---
loadAndInitialize();
