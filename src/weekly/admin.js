

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

const weekForm = document.getElementById('week-form');
const weeksTbody = document.getElementById('weeks-tbody');
const addWeekBtn = document.getElementById('add-week');

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
   const row = document.createElement('tr');

  
    const titleCell = document.createElement('td');
    titleCell.textContent = week.title;
    row.appendChild(titleCell);

    
    const dateCell = document.createElement('td');
    dateCell.textContent = week.start_date;
    row.appendChild(dateCell);

  
    const descCell = document.createElement('td');
    descCell.textContent = week.description || '';
    row.appendChild(descCell);

    
    const actionsCell = document.createElement('td');


    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-btn';
    editButton.dataset.id = week.id;
    actionsCell.appendChild(editButton);

   
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-btn';
    deleteButton.dataset.id = week.id;
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);

    return row;
}// ... your implementation here ...


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
 weeksTbody.innerHTML = '';
    
   
    weeks.forEach(week => {
       
        weeksTbody.appendChild(createWeekRow(week));
    });
} // ... your implementation here ...


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
 event.preventDefault();

    // 2. Read values from form fields
    const title = document.getElementById('week-title').value;
    const start_date = document.getElementById('week-start-date').value;
    const description = document.getElementById('week-description').value;
    const linksText = document.getElementById('week-links').value;
    
    // Convert links textarea (one URL per line) to array
    const links = linksText
        .split('\n')
        .map(link => link.trim())
        .filter(link => link !== '');

    
    const editId = addWeekBtn.dataset.editId;

    if (editId) {
        // EDIT MODE: Update existing week
        const id = Number(editId);
        await handleUpdateWeek(id, { title, start_date, description, links });
    } else {
        // ADD MODE: Create new week
        try {
            const response = await fetch('./api/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, start_date, description, links })
            });
            
            const result = await response.json();

            if (result.success === true) {
                // Add new week to global array
                weeks.push({
                    id: result.id,
                    title: title,
                    start_date: start_date,
                    description: description,
                    links: links
                });
                
                // Refresh table display
                renderTable();
                
                // Reset form fields
                weekForm.reset();
            }
        } catch (error) {
            console.error('Error adding week:', error);
        }
    }
}


 // ... your implementation here ...


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
 
    try {
        // 1. Send PUT request to API
        const response = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...fields })
        });
        
        const result = await response.json();

        // 2. On success
        if (result.success === true) {
            // Update the matching entry in global weeks array
            const index = weeks.findIndex(week => week.id === id);
            if (index !== -1) {
                weeks[index] = { id, ...fields };
            }
            
            // Refresh the table display
            renderTable();
            
            // Reset the form fields
            weekForm.reset();
            addWeekBtn.textContent = 'Add Week';
            delete addWeekBtn.dataset.editId;
        }
    } catch (error) {
        console.error('Error updating week:', error);
    }
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
   const target = event.target;
    const id = Number(target.dataset.id);

    if (target.classList.contains('delete-btn')) {
        // Optional: Confirm before deleting
        const confirmed = confirm('Are you sure you want to delete this week?');
        if (!confirmed) return;
        
        try {
            const response = await fetch(`./api/index.php?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success === true) {
                // Remove week from global array
                weeks = weeks.filter(week => week.id !== id);
                  renderTable();
            }
        } catch (error) {
            console.error('Error deleting week:', error);
        }
}
 if (target.classList.contains('edit-btn')) {
        // Find the matching week in global array
        const weekToEdit = weeks.find(week => week.id === id);
        if (!weekToEdit) return;

        // Populate form fields with week data
        document.getElementById('week-title').value = weekToEdit.title;
        document.getElementById('week-start-date').value = weekToEdit.start_date;
        document.getElementById('week-description').value = weekToEdit.description || '';
        
        // Convert links array to newline-separated string for textarea
        document.getElementById('week-links').value = (weekToEdit.links || []).join('\n');

        // Change submit button to "Update Week" mode
        addWeekBtn.textContent = 'Update Week';
        addWeekBtn.dataset.editId = weekToEdit.id;
    }
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
 try {
  
        const response = await fetch('./api/index.php');
        const result = await response.json();

     
        if (result.success === true) {
            weeks = result.data || [];
        } else {
            weeks = [];
        }


        renderTable();

    } catch (error) {
        console.error('Error loading weeks:', error);
        weeks = [];
        renderTable();
    }

    weekForm.addEventListener('submit', handleAddWeek);

    weeksTbody.addEventListener('click', handleTableClick);
}

// --- Initial Page Load ---
loadAndInitialize();
