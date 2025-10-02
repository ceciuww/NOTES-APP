import AboutPage from '../pages/about/about-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import HomePage from '../pages/home/home-page';
import ForgotPasswordPage from '../pages/login/forgot-pass-page';
import LoginPage from '../pages/login/login-page';
import ProfilePage from '../pages/login/profile-page';
import RegisterPage from '../pages/login/register-page';

const routes = {
  '#home': new HomePage(),
  '#about': new AboutPage(),
  '#login': new LoginPage(),
  '#profile': new ProfilePage(),
  '#forgot-password': new ForgotPasswordPage(),
  '#register': new RegisterPage(),
  '#add-story': new AddStoryPage(),
  '#': new HomePage(), // Default route
};

export default {
  routes,
  init() {
    return {
      navigate: (path) => {
        // Use hash for routing
        window.location.hash = path;
        this.renderPage(path);
      },
      getCurrentPath: () => {
        return window.location.hash || '#home';
      }
    };
  },
  
  renderPage(path) {
    // If no hash is present, use home as default
    const routePath = path || '#home';
    const page = this.routes[routePath];
    if (page && typeof page.render === 'function') {
      page.render();
    } else {
      // Fallback to home if route not found
      this.routes['#home'].render();
    }
  }
};