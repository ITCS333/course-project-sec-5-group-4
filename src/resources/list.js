// --- Element Selections ---
const resourceSection = document.getElementById('resource-list-section');

// --- Functions ---

function createResourceArticle(resource) {
  const article = document.createElement('article');

  article.innerHTML = `
    <h2>${resource.title}</h2>
    <p>${resource.description}</p>
    <a href="details.html?id=${resource.id}">
      View Resource & Discussion
    </a>
  `;

  return article;
}

async function loadResources() {
  try {
    const response = await fetch('./api/index.php');
    const result = await response.json();

    // Clear existing content
    resourceSection.innerHTML = '';

    const resources = result.data || [];

    resources.forEach(resource => {
      const article = createResourceArticle(resource);
      resourceSection.appendChild(article);
    });

  } catch (error) {
    resourceSection.innerHTML = '<p>Error loading resources.</p>';
    console.error(error);
  }
}

// --- Initial Page Load ---
loadResources();
