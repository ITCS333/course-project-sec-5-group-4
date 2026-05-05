// --- Global Data Store ---
let currentResourceId = null;
let currentComments = [];

// --- Element Selections ---
const titleEl = document.getElementById('resource-title');
const descEl = document.getElementById('resource-description');
const linkEl = document.getElementById('resource-link');
const commentList = document.getElementById('comment-list');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('new-comment');

// --- Functions ---

function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderResourceDetails(resource) {
  titleEl.textContent = resource.title;
  descEl.textContent = resource.description;
  linkEl.href = resource.link;
}

function createCommentArticle(comment) {
  const article = document.createElement('article');

  article.innerHTML = `
    <p>${comment.text}</p>
    <footer>Posted by: ${comment.author}</footer>
  `;

  return article;
}

function renderComments() {
  commentList.innerHTML = '';

  currentComments.forEach(comment => {
    const article = createCommentArticle(comment);
    commentList.appendChild(article);
  });
}

async function handleAddComment(event) {
  event.preventDefault();

  const commentText = commentInput.value.trim();
  if (!commentText) return;

  const response = await fetch('./api/index.php?action=comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: 'Student',
      text: commentText
    })
  });

  const result = await response.json();

  // Add new comment to array
  currentComments.push(result);

  renderComments();
  commentInput.value = '';
}

async function initializePage() {
  currentResourceId = getResourceIdFromURL();

  if (!currentResourceId) {
    titleEl.textContent = "Resource not found.";
    return;
  }

  try {
    const [resourceRes, commentsRes] = await Promise.all([
      fetch(`./api/index.php?id=${currentResourceId}`),
      fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`)
    ]);

    const resourceData = await resourceRes.json();
    const commentsData = await commentsRes.json();

    if (!resourceData.success || !resourceData.data) {
      titleEl.textContent = "Resource not found.";
      return;
    }

    const resource = resourceData.data;
    currentComments = commentsData.data || [];

    renderResourceDetails(resource);
    renderComments();

    commentForm.addEventListener('submit', handleAddComment);

  } catch (error) {
    titleEl.textContent = "Error loading resource.";
    console.error(error);
  }
}

// --- Initial Page Load ---
initializePage();
