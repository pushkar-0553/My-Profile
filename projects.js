/*
 * GitHub Projects Portfolio Integration
 * 
 * This script fetches and displays your GitHub repositories as projects in your portfolio.
 * 
 * CUSTOM COVER IMAGES:
 * To add a custom cover image for a repository, add a file named "cover.png" to the root of your repository.
 * The script will automatically fetch and display this image as the cover for your project.
 * Recommended image size: 800x400px (16:9 ratio)
 * 
 * If no cover.png is found, a placeholder will be shown with the first letter of your repository name.
 * 
 * GITHUB API RATE LIMITS:
 * Unauthenticated requests are limited to 60 requests per hour.
 * To increase this limit, you can add a personal access token or client ID and secret.
 */

// GitHub Username - Change this to your GitHub username
const GITHUB_USERNAME = 'pushkar-0553';
const MAX_REPOS = 12; // Maximum number of repos to show on homepage

// Store all projects globally for filtering
let allProjects = [];
let displayedProjects = [];

// GitHub Authentication (Optional but recommended)
// To increase rate limits from 60 to 5000 requests per hour
// Create a personal access token at https://github.com/settings/tokens
const GITHUB_TOKEN = ''; // Add your token here

// OR use Client ID and Secret (for server-to-server applications)
// const CLIENT_ID = 'your_client_id';  
// const CLIENT_SECRET = 'your_client_secret';

// GitHub API endpoints with authentication parameters if available
function getGitHubApiUrl(endpoint) {
    let url = `https://api.github.com${endpoint}`;
    
    // Add authentication parameters if available
    if (typeof GITHUB_TOKEN !== 'undefined') {
        url += (url.includes('?') ? '&' : '?') + `access_token=${GITHUB_TOKEN}`;
    } else if (typeof CLIENT_ID !== 'undefined' && typeof CLIENT_SECRET !== 'undefined') {
        url += (url.includes('?') ? '&' : '?') + `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    }
    
    return url;
}

const GITHUB_API = {
    USER: getGitHubApiUrl(`/users/${GITHUB_USERNAME}`),
    REPOS: getGitHubApiUrl(`/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`)
};

// DOM elements
const repoList = document.getElementById('github-repo-list');
const repoCount = document.getElementById('repo-count');
const forkCount = document.getElementById('fork-count');
const starCount = document.getElementById('star-count');
const projectsGrid = document.getElementById('projects-grid');
const loadingContainer = document.getElementById('loading-container');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const modal = document.getElementById('project-modal');
const closeModalBtn = document.getElementById('modal-close');

// Language colors for GitHub
const LANGUAGE_COLORS = {
    "JavaScript": "#f1e05a",
    "TypeScript": "#2b7489",
    "Python": "#3572A5",
    "Java": "#b07219",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "C#": "#178600",
    "PHP": "#4F5D95",
    "C++": "#f34b7d",
    "Ruby": "#701516",
    "Swift": "#ffac45",
    "Go": "#00ADD8",
    "Rust": "#dea584",
    "Kotlin": "#F18E33",
    "Dart": "#00B4AB",
    "Shell": "#89e051",
    "Vue": "#2c3e50",
    "React": "#61dafb"
};

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Check which elements are available on the page
    console.log('projectsGrid exists:', !!projectsGrid);
    console.log('repoList exists:', !!repoList);
    
    // Initialize projects page
    if (projectsGrid) {
        console.log('Initializing projects page');
        initProjects();
    }
    
    // Initialize homepage repo section
    if (repoList) {
        console.log('Initializing homepage repo section');
        fetchGitHubData()
            .then(data => {
                console.log('Homepage data loaded:', !!data);
            })
            .catch(err => {
                console.error('Error in fetchGitHubData for homepage:', err);
            });
    }
    
    // Set up the project modal functionality
    if (modal && closeModalBtn) {
        console.log('Setting up project modal');
        setupProjectModal();
    }
    
    console.log('Initialization complete');
});

// Primary function to fetch and display GitHub projects
async function initProjects() {
    try {
        showLoading(true);
        await fetchAndDisplayProjects();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize projects:', error);
        showError('Failed to load projects from GitHub', 'Please try again later.');
    } finally {
        showLoading(false);
    }
}

// Fetch projects from GitHub API
async function fetchAndDisplayProjects() {
    try {
        const projects = await fetchGitHubData(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=${MAX_REPOS}&sort=updated&direction=desc`);
        
        // Check if any projects were returned
        if (!projects || projects.length === 0) {
            throw new Error('No repositories found.');
        }
        
        // Store all projects and display them
        allProjects = projects;
        displayedProjects = [...allProjects];
        await displayProjects(displayedProjects);
        
    } catch (error) {
        console.error('Error fetching GitHub repositories:', error);
        
        // Check if it's a rate limit error
        if (error.message && error.message.includes('rate limit')) {
            showRateLimitError();
        } else {
            showError('Failed to load projects from GitHub', 'Please try again later.');
        }
    }
}

// Fetch data from GitHub API with error handling
async function fetchGitHubData(url) {
    try {
        const response = await fetch(url);
        
        // Check if rate limit is exceeded
        if (response.status === 403) {
            const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
            if (rateLimitRemaining && parseInt(rateLimitRemaining) === 0) {
                throw new Error('GitHub API rate limit exceeded.');
            }
        }
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching data from GitHub:', error);
        throw error;
    }
}

// Fetch with authentication if a token is provided
async function fetchWithAuth(url) {
    // Check if token is in localStorage (you would set this in settings)
    const token = localStorage.getItem('github_token');
    
    const headers = {};
    if (token) {
        headers.Authorization = `token ${token}`;
    }
    
    return fetch(url, { headers });
}

// Display projects in the grid
async function displayProjects(projects) {
    projectsGrid.innerHTML = '';
    
    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = '<div class="no-projects">No projects found matching your criteria.</div>';
        return;
    }
    
    // Create project cards in parallel
    const projectCards = await Promise.all(
        projects.map(async (repo) => {
            try {
                return await createProjectCard(repo);
            } catch (error) {
                console.error(`Error creating card for ${repo.name}:`, error);
                return null;
            }
        })
    );
    
    // Filter out any null results and append to grid
    projectCards.filter(card => card !== null).forEach(card => {
        projectsGrid.appendChild(card);
    });
}

// Create a project card element
async function createProjectCard(repo) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('data-repo', repo.name);
    
    // Try to fetch cover image
    let coverImageUrl = '';
    try {
        const coverResponse = await fetchWithAuth(`https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/contents/cover.png`);
        if (coverResponse.ok) {
            const coverData = await coverResponse.json();
            coverImageUrl = coverData.download_url;
        }
    } catch (error) {
        console.log(`No cover image found for ${repo.name}`);
    }
    
    // Create HTML for the card
    card.innerHTML = `
        <img class="project-image" src="${coverImageUrl || './assets/img/project-placeholder.jpg'}" alt="${repo.name}" onerror="this.src='./assets/img/project-placeholder.jpg'">
        <div class="project-content">
            <h3 class="project-title">${repo.name}</h3>
            <p class="project-description">${repo.description || 'No description provided.'}</p>
            <div class="project-details">
                ${repo.language ? `
                <div class="language-badge">
                    <i class="${getLanguageIcon(repo.language)}"></i>
                    ${repo.language}
                </div>` : ''}
                <div class="project-stat">
                    <i class="uil uil-star"></i>
                    ${repo.stargazers_count}
                </div>
                <div class="project-stat">
                    <i class="uil uil-code-branch"></i>
                    ${repo.forks_count}
                </div>
            </div>
        </div>
    `;
    
    // Add click event to open modal
    card.addEventListener('click', () => {
        openProjectModal(repo, coverImageUrl);
    });
    
    return card;
}

// Get icon class for programming language
function getLanguageIcon(language) {
    const icons = {
        'JavaScript': 'uil uil-java-script',
        'TypeScript': 'uil uil-java-script',
        'HTML': 'uil uil-html5',
        'CSS': 'uil uil-css3-simple',
        'Python': 'uil uil-python',
        'Java': 'uil uil-java',
        'C#': 'uil uil-window',
        'PHP': 'uil uil-php',
        'Ruby': 'uil uil-ruby',
        'Swift': 'uil uil-apple-alt',
        'Go': 'uil uil-google',
        'Rust': 'uil uil-setting',
        'C++': 'uil uil-plus-square',
        'C': 'uil uil-c',
    };
    
    return icons[language] || 'uil uil-code';
}

// Open project modal with details
async function openProjectModal(repo, coverImageUrl) {
    // Fetch additional data if needed (topics, etc.)
    let topics = [];
    try {
        const topicsResponse = await fetchWithAuth(`https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/topics`);
        if (topicsResponse.ok) {
            const topicsData = await topicsResponse.json();
            topics = topicsData.names || [];
        }
    } catch (error) {
        console.log(`Could not fetch topics for ${repo.name}`);
    }
    
    // Create modal content
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">${repo.name}</h2>
            <button id="modal-close" class="modal-close">
                <i class="uil uil-times"></i>
            </button>
        </div>
        <div class="modal-body">
            ${coverImageUrl ? `<img class="modal-image" src="${coverImageUrl}" alt="${repo.name}">` : ''}
            <p class="modal-description">${repo.description || 'No description provided.'}</p>
            
            ${repo.language ? `
            <div class="modal-section">
                <h4 class="modal-section-title">Primary Language</h4>
                <div class="language-badges">
                    <div class="language-badge">
                        <i class="${getLanguageIcon(repo.language)}"></i>
                        ${repo.language}
                    </div>
                </div>
            </div>` : ''}
            
            ${topics.length > 0 ? `
            <div class="modal-section">
                <h4 class="modal-section-title">Topics</h4>
                <div class="topic-tags">
                    ${topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                </div>
            </div>` : ''}
        </div>
        <div class="modal-footer">
            <div class="modal-footer-stats">
                <div class="project-stat">
                    <i class="uil uil-star"></i>
                    ${repo.stargazers_count} stars
                </div>
                <div class="project-stat">
                    <i class="uil uil-code-branch"></i>
                    ${repo.forks_count} forks
                </div>
                <div class="project-stat">
                    <i class="uil uil-eye"></i>
                    ${repo.watchers_count} watchers
                </div>
            </div>
            <div class="modal-footer-links">
                <a href="${repo.html_url}" target="_blank" class="project-link">
                    <i class="uil uil-github"></i>
                </a>
                ${repo.homepage ? `
                <a href="${repo.homepage}" target="_blank" class="project-link">
                    <i class="uil uil-external-link-alt"></i>
                </a>` : ''}
            </div>
        </div>
    `;
    
    // Setup close button
    document.getElementById('modal-close').addEventListener('click', closeModal);
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close the modal
function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Filter projects based on search input and technology filter
function filterProjects() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterTechnology = filterSelect.value;
    
    displayedProjects = allProjects.filter(repo => {
        const matchesSearch = 
            repo.name.toLowerCase().includes(searchTerm) || 
            (repo.description && repo.description.toLowerCase().includes(searchTerm));
        
        const matchesTechnology = 
            filterTechnology === 'all' || 
            (filterTechnology === repo.language);
        
        return matchesSearch && matchesTechnology;
    });
    
    displayProjects(displayedProjects);
}

// Show loading state
function showLoading(isLoading) {
    if (isLoading) {
        loadingContainer.style.display = 'flex';
        projectsGrid.style.display = 'none';
    } else {
        loadingContainer.style.display = 'none';
        projectsGrid.style.display = 'grid';
    }
}

// Show error message
function showError(title, message) {
    projectsGrid.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <i class="uil uil-exclamation-triangle"></i>
            </div>
            <h3 class="error-title">${title}</h3>
            <p class="error-message">${message}</p>
            <button class="error-button" onclick="initProjects()">
                <i class="uil uil-redo"></i> 
                Try Again
            </button>
        </div>
    `;
}

// Show rate limit error message
function showRateLimitError() {
    projectsGrid.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <i class="uil uil-exclamation-triangle"></i>
            </div>
            <h3 class="error-title">GitHub API Rate Limit Exceeded</h3>
            <p class="error-message">
                The GitHub API rate limit has been reached. Please try again later or consider authenticating to increase the limit.
            </p>
            <button class="error-button" onclick="initProjects()">
                <i class="uil uil-redo"></i> 
                Try Again
            </button>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Search and filter
    searchInput.addEventListener('input', filterProjects);
    filterSelect.addEventListener('change', filterProjects);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
    
    // Populate technology filter options
    populateFilterOptions();
}

// Populate filter dropdown with available technologies
function populateFilterOptions() {
    // Get unique languages
    const languages = [...new Set(allProjects
        .map(repo => repo.language)
        .filter(lang => lang !== null))];
    
    // Sort languages alphabetically
    languages.sort();
    
    // Add options to select
    filterSelect.innerHTML = '<option value="all">All Technologies</option>';
    languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language;
        option.textContent = language;
        filterSelect.appendChild(option);
    });
}

// Set up project modal functionality
function setupProjectModal() {
    // Close modal when clicking the close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Create placeholder image for missing project images
document.addEventListener('DOMContentLoaded', () => {
    // Create a placeholder image in case project images are missing
    const placeholderImg = new Image();
    placeholderImg.src = 'assets/img/project-placeholder.jpg';
}); 