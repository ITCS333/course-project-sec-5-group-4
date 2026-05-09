// --- Global Data Store ---
let resources = [];
let editMode = false;
let editId = null;

// --- Element Selections ---
const form = document.getElementById('resource-form');
const tableBody = document.getElementById('resources-tbody');

// --- Functions ---

function createResourceRow(resource) {
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td>${resource.title}</td>
    <td>${resource.description}</td>
    <td><a href="${resource.link}" target="_blank">${resource.link}</a></td>
    <td>
      <button class="edit-btn" data-id="${resource.id}">Edit</button>
      <button class="delete-btn" data-id="${resource.id}">Delete</button>
    </td>
  `;

  return tr;
}

function renderTable() {
  tableBody.innerHTML = '';

  resources.forEach(resource => {
    const row = createResourceRow(resource);
    tableBody.appendChild(row);
  });
}

async function handleAddResource(event) {
  event.preventDefault();

  const title = document.getElementById('resource-title').value;
  const description = document.getElementById('resource-description').value;
  const link = document.getElementById('resource-link').value;

  if (editMode) {
    // UPDATE (PUT)
    await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, title, description, link })
    });

    // update local array
    resources = resources.map(r =>
      r.id == editId ? { id: editId, title, description, link } : r
    );

    editMode = false;
    editId = null;
    document.getElementById('add-resource').textContent = 'Add Resource';

  } else {
    // CREATE (POST)
    const response = await fetch('./api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, link })
    });

    const result = await response.json();

    resources.push({
      id: result.id,
      title,
      description,
      link
    });
  }

  renderTable();
  form.reset();
}

async function handleTableClick(event) {
  const id = event.target.dataset.id;

  if (event.target.classList.contains('delete-btn')) {
    // DELETE
    await fetch(`./api/index.php?id=${id}`, {
      method: 'DELETE'
    });

    resources = resources.filter(r => r.id != id);
    renderTable();
  }

  if (event.target.classList.contains('edit-btn')) {
    const resource = resources.find(r => r.id == id);

    document.getElementById('resource-title').value = resource.title;
    document.getElementById('resource-description').value = resource.description;
    document.getElementById('resource-link').value = resource.link;

    editMode = true;
    editId = id;

    document.getElementById('add-resource').textContent = 'Update Resource';
  }
}

async function loadAndInitialize() {
  const response = await fetch('./api/index.php');
  const result = await response.json();

  rresources = result.data || result;

  renderTable();

  form.addEventListener('submit', handleAddResource);
  tableBody.addEventListener('click', handleTableClick);
}

// --- Initial Page Load ---
loadAndInitialize();
