import routes from '../routes/routes.js';
import '../styles.css';

class StoryApp {
  constructor() {
    this.router = null;
  }

  init() {
    try {
      // Initialize router
      this.router = routes.init();
      
      // Make router globally available for navigation from HTML
      window.router = this.router;
      
      // Handle hash changes for navigation
      window.addEventListener('hashchange', () => {
        const path = this.getPathFromHash();
        this.router.navigate(path, false); // false to prevent adding to history
      });
      
      // Add navigation event listeners
      this.setupNavigation();
      
      // Render initial page based on current hash
      const initialPath = this.getPathFromHash();
      this.router.navigate(initialPath, false);
      
      console.log('Story App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showErrorUI();
    }
  }

  // Extract path from hash (e.g., #/login -> /login)
  getPathFromHash() {
    const hash = window.location.hash.substring(1);
    return hash || '/';
  }

  setupNavigation() {
    // Add click event listeners to all navigation links
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-nav]')) {
        e.preventDefault();
        const path = e.target.getAttribute('href');
        this.router.navigate(path);
      }
      
      // Handle auth tabs
      if (e.target.matches('.auth-tab')) {
        const tab = e.target.getAttribute('data-tab');
        this.switchAuthTab(tab);
      }
    });
  }

  switchAuthTab(tab) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.auth-tab, .auth-content').forEach(el => {
      el.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-content`).classList.add('active');
  }

  showErrorUI() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="error-container">
          <h2>Application Error</h2>
          <p>Failed to initialize the application. Please refresh the page.</p>
          <button onclick="window.location.reload()">Refresh Page</button>
        </div>
      `;
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new StoryApp();
  app.init();
});

export default StoryApp;