export class RouterService {
  constructor() {
    this.observers = [];
    this.currentRoute = '';
    this.routeParams = {};
    
    // Handle initial hash on page load
    window.addEventListener('load', () => this.handleHashChange());
    
    // Handle hash changes
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  addObserver(observer) {
    if (observer && typeof observer.onHashChange === 'function') {
      this.observers.push(observer);
    }
  }

  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  navigateTo(route, params = {}) {
    let hash = route;
    
    // Build hash with parameters if needed
    if (params.id) {
      if (route === 'story-detail') {
        hash = `story-detail-${params.id}`;
      } else if (route === 'update-story') {
        hash = `update-story-${params.id}`;
      }
    }
    
    window.location.hash = hash;
    // Don't call handleHashChange here - it will be triggered by the hashchange event
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getRouteParams() {
    return { ...this.routeParams }; // Return a copy to prevent mutation
  }

  handleHashChange() {
    const hash = window.location.hash.substring(1);
    
    // Default to home if no hash
    if (!hash) {
      this.currentRoute = 'home';
      this.routeParams = {};
      this.notifyObservers();
      return;
    }
    
    // Parse route and parameters
    let route = hash;
    let params = {};
    
    // Handle story-detail routes
    if (hash.startsWith('story-detail-')) {
      route = 'story-detail';
      params = { id: hash.replace('story-detail-', '') };
    } 
    // Handle update-story routes
    else if (hash.startsWith('update-story-')) {
      route = 'update-story';
      params = { id: hash.replace('update-story-', '') };
    }
    // Handle simple routes
    else if (hash === 'login' || hash === 'register' || hash === 'add-story' || 
             hash === 'map-view' || hash === 'logout' || hash === 'home') {
      route = hash;
    }
    // Default to home for unknown routes
    else {
      route = 'home';
    }
    
    this.currentRoute = route;
    this.routeParams = params;
    this.notifyObservers();
  }

  notifyObservers() {
    this.observers.forEach(observer => {
      try {
        observer.onHashChange(this.currentRoute, this.routeParams);
      } catch (error) {
        console.error('Error notifying observer:', error);
      }
    });
  }
}