class StoryApp {
  constructor() {
    this.router = null;
  }
 
  init() {
    try {
      this.router = AppRouter.init();
      console.log('Story App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showErrorUI();
    }
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