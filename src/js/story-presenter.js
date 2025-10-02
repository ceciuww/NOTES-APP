export class StoryPresenter {
  constructor(view, model, routerService) {
    this.view = view;
    this.model = model;
    this.routerService = routerService;
    this.currentPage = 1;
    this.pageSize = 20;
    this.hasMore = false;
    this.stories = [];
    this.currentStoryId = null;
    this.map = null;
    this.detailMap = null;
    this.storiesMap = null;
    this.cameraStream = null;

    // Setup event listeners
    this.setupEventListeners();
    
    // Register as router observer
    this.routerService.addObserver(this);
    
    // Add hash change listener
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });
    
    // Handle initial routing
    this.handleHashChange();
  }

  onHashChange(route, params) {
    this.handleHashChange(route, params);
  }

  setupEventListeners() {
    // Navigation
    this.view.on('navigate', (route) => {
      this.routerService.navigateTo(route);
    });

    // Authentication
    this.view.on('login', (credentials) => {
      this.handleLogin(credentials);
    });

    this.view.on('register', (userData) => {
      this.handleRegister(userData);
    });

    this.view.on('logout', () => {
      this.handleLogout();
    });

    // Stories
    this.view.on('loadMore', () => {
      this.loadMoreStories();
    });

    this.view.on('addStory', (storyData) => {
      this.handleAddStory(storyData);
    });

    this.view.on('updateStory', (storyData) => {
      this.handleUpdateStory(storyData);
    });

    this.view.on('deleteStory', (storyId) => {
      this.handleDeleteStory(storyId);
    });

    // Camera
    this.view.on('capturePhoto', () => {
      this.capturePhoto();
    });

    this.view.on('retakePhoto', () => {
      this.retakePhoto();
    });

    this.view.on('toggleLocation', (show) => {
      this.toggleLocationInput(show);
    });
  }

  async handleHashChange(route, params) {
    const currentRoute = route || this.routerService.getCurrentRoute();
    const routeParams = params || this.routerService.getRouteParams();

    try {
      switch (currentRoute) {
        case 'home':
          await this.showHome();
          break;
        case 'login':
          this.showLogin();
          break;
        case 'register':
          this.showRegister();
          break;
        case 'add-story':
          await this.showAddStory();
          break;
        case 'story-detail':
          if (routeParams.id) await this.showStoryDetail(routeParams.id);
          break;
        case 'update-story':
          if (routeParams.id) await this.showUpdateStory(routeParams.id);
          break;
        case 'map-view':
          await this.showMapView();
          break;
        case 'logout':
          this.handleLogout();
          break;
        default:
          this.routerService.navigateTo('home');
      }
    } catch (error) {
      console.error('Routing error:', error);
      this.view.showNotification('Failed to load page', 'error');
      this.routerService.navigateTo('home');
    }
  }

  async showHome() {
    try {
      this.currentPage = 1;
      this.stories = [];

      if (this.model.isLoggedIn()) {
        const response = await this.model.getStories(this.currentPage, this.pageSize);
        if (!response.error) {
          this.stories = response.listStory;
          this.hasMore = response.listStory.length === this.pageSize;
        }
      }

      this.view.renderView(this.view.homeView(
        this.stories,
        this.model.isLoggedIn(),
        this.model.getCurrentUserId(),
        this.hasMore
      ));

      this.view.setupHomeEventListeners();
    } catch (error) {
      console.error('Error loading stories:', error);
      this.view.renderView(this.view.homeView([], false, null, false));
      this.view.showNotification('Error loading stories', 'error');
    }
  }

  async loadMoreStories() {
    this.currentPage += 1;
    try {
      if (this.model.isLoggedIn()) {
        const response = await this.model.getStories(this.currentPage, this.pageSize);
        if (!response.error) {
          this.stories = [...this.stories, ...response.listStory];
          this.hasMore = response.listStory.length === this.pageSize;
          this.view.renderView(this.view.homeView(
            this.stories,
            this.model.isLoggedIn(),
            this.model.getCurrentUserId(),
            this.hasMore
          ));
          this.view.setupHomeEventListeners();
        } else {
          this.view.showNotification('Failed to load more stories', 'error');
        }
      }
    } catch (error) {
      console.error('Error loading more stories:', error);
      this.view.showNotification('Error loading more stories', 'error');
    }
  }

  showLogin() {
    this.stopCamera();
    this.view.renderView(this.view.loginView());
    this.view.setupLoginEventListeners();
  }

  showRegister() {
    this.stopCamera();
    this.view.renderView(this.view.registerView());
    this.view.setupRegisterEventListeners();
  }

  async showAddStory() {
    if (!this.model.isLoggedIn()) {
      this.view.showNotification('Please login to add a story', 'error');
      this.routerService.navigateTo('login');
      return;
    }

    this.view.renderView(this.view.addStoryView());
    this.view.setupAddStoryEventListeners();
    await this.initCamera();
  }

  async showUpdateStory(storyId) {
    if (!this.model.isLoggedIn()) {
      this.view.showNotification('Please login to update a story', 'error');
      this.routerService.navigateTo('login');
      return;
    }

    try {
      const response = await this.model.getStoryDetail(storyId);
      if (!response.error && response.story.createdBy === this.model.getCurrentUserId()) {
        this.currentStoryId = storyId;
        this.view.renderView(this.view.updateStoryView(response.story));
        this.view.setupUpdateStoryEventListeners();

        if (response.story.lat && response.story.lon) {
          this.initLocationMap(response.story.lat, response.story.lon);
        }
      } else {
        this.view.showNotification('You can only update your own stories', 'error');
        this.routerService.navigateTo('home');
      }
    } catch (error) {
      console.error('Error loading story for update:', error);
      this.view.showNotification('Error loading story', 'error');
      this.routerService.navigateTo('home');
    }
  }

  async showStoryDetail(storyId) {
    try {
      const response = await this.model.getStoryDetail(storyId);
      if (!response.error) {
        const canEdit = this.model.isLoggedIn() && response.story.createdBy === this.model.getCurrentUserId();
        this.currentStoryId = storyId;
        this.view.renderView(this.view.storyDetailView(response.story, canEdit));
        this.view.setupStoryDetailEventListeners();
        
        if (response.story.lat && response.story.lon) {
          this.initDetailMap(response.story.lat, response.story.lon);
        }
      } else {
        this.view.showNotification('Failed to load story details', 'error');
        this.routerService.navigateTo('home');
      }
    } catch (error) {
      console.error('Error loading story details:', error);
      this.view.showNotification('Error loading story details', 'error');
      this.routerService.navigateTo('home');
    }
  }

  async showMapView() {
    this.stopCamera();
    try {
      if (this.model.isLoggedIn()) {
        const response = await this.model.getStories();
        if (!response.error) this.stories = response.listStory;
      }
      this.view.renderView(this.view.mapView(this.stories));
      this.initStoriesMap();
    } catch (error) {
      console.error('Error loading stories for map:', error);
      this.view.renderView(this.view.mapView([]));
      this.view.showNotification('Error loading stories for map', 'error');
    }
  }

  async handleLogin(credentials) {
    this.view.showLoading('login-btn');
    
    try {
      const response = await this.model.login(credentials);
      if (!response.error) {
        this.model.setAuthToken(response.loginResult.token);
        this.model.setUser({
          name: response.loginResult.name,
          userId: response.loginResult.userId
        });
        this.view.updateAuthUI(true, response.loginResult.name);
        this.view.showNotification('Login successful!');
        this.routerService.navigateTo('home');
      } else {
        this.view.showNotification(response.message, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.view.showNotification('Login failed. Please try again.', 'error');
    } finally {
      this.view.hideLoading('login-btn');
    }
  }

  async handleRegister(userData) {
    this.view.showLoading('register-btn');
    
    try {
      const response = await this.model.register(userData);
      if (!response.error) {
        this.view.showNotification('Registration successful! Please login.');
        this.routerService.navigateTo('login');
      } else {
        this.view.showNotification(response.message, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.view.showNotification('Registration failed. Please try again.', 'error');
    } finally {
      this.view.hideLoading('register-btn');
    }
  }

  async handleAddStory(storyData) {
    if (!this.model.isLoggedIn()) {
      this.view.showNotification('Please login to add a story', 'error');
      this.routerService.navigateTo('login');
      return;
    }

    this.view.showSubmitLoading();
    
    try {
      const formData = new FormData();
      formData.append('description', storyData.description);
      formData.append('photo', storyData.photo);
      
      if (storyData.lat && storyData.lon) {
        formData.append('lat', storyData.lat);
        formData.append('lon', storyData.lon);
      }

      const response = await this.model.addStory(formData);
      if (!response.error) {
        this.view.showNotification('Story added successfully!');
        this.routerService.navigateTo('home');
      } else {
        this.view.showNotification(response.message, 'error');
      }
    } catch (error) {
      console.error('Error adding story:', error);
      this.view.showNotification('Failed to add story', 'error');
    } finally {
      this.view.hideSubmitLoading();
    }
  }

  async handleUpdateStory(storyData) {
    if (!this.model.isLoggedIn()) {
      this.view.showNotification('Please login to update a story', 'error');
      this.routerService.navigateTo('login');
      return;
    }

    this.view.showUpdateLoading();
    
    try {
      const formData = new FormData();
      formData.append('description', storyData.description);
      
      // Only include photo if it was changed
      if (storyData.photo) {
        formData.append('photo', storyData.photo);
      }
      
      if (storyData.lat && storyData.lon) {
        formData.append('lat', storyData.lat);
        formData.append('lon', storyData.lon);
      } else {
        formData.append('lat', '');
        formData.append('lon', '');
      }

      const response = await this.model.updateStory(this.currentStoryId, formData);
      if (!response.error) {
        this.view.showNotification('Story updated successfully!');
        this.routerService.navigateTo('story-detail', { id: this.currentStoryId });
      } else {
        this.view.showNotification(response.message, 'error');
      }
    } catch (error) {
      console.error('Error updating story:', error);
      this.view.showNotification('Failed to update story', 'error');
    } finally {
      this.view.hideUpdateLoading();
    }
  }

  async handleDeleteStory(storyId) {
    if (!this.model.isLoggedIn()) {
      this.view.showNotification('Please login to delete a story', 'error');
      this.routerService.navigateTo('login');
      return;
    }

    const confirmed = confirm('Are you sure you want to delete this story?');
    if (!confirmed) return;

    try {
      const response = await this.model.deleteStory(storyId || this.currentStoryId);
      if (!response.error) {
        this.view.showNotification('Story deleted successfully!');
        this.routerService.navigateTo('home');
      } else {
        this.view.showNotification(response.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      this.view.showNotification('Failed to delete story', 'error');
    }
  }

  handleLogout() {
    this.model.logout();
    this.view.updateAuthUI(false);
    this.view.showNotification('Logged out successfully');
    this.routerService.navigateTo('home');
  }

  async initCamera() {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      const video = document.getElementById('camera-preview');
      if (video) {
        video.srcObject = this.cameraStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.view.showNotification('Cannot access camera', 'error');
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
  }

  capturePhoto() {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('photo-canvas');
    const previewImg = document.getElementById('preview-img');

    if (video && canvas && previewImg) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg');
      previewImg.src = imageData;
      
      this.view.setPhotoData(imageData);
      this.view.togglePhotoPreview(true);
      
      this.stopCamera();
    }
  }

  retakePhoto() {
    this.view.setPhotoData('');
    this.view.togglePhotoPreview(false);
    this.initCamera();
  }

  toggleLocationInput(show) {
    const mapContainer = document.getElementById('map-container');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');

    if (mapContainer && latInput && lonInput) {
      if (show) {
        mapContainer.style.display = 'block';
        this.initLocationMap();
      } else {
        mapContainer.style.display = 'none';
        latInput.value = '';
        lonInput.value = '';
      }
    }
  }

  initLocationMap(initialLat = -6.2088, initialLon = 106.8456) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Clean up existing map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = L.map('map').setView([initialLat, initialLon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    let marker = null;
    if (initialLat && initialLon) {
      marker = L.marker([initialLat, initialLon]).addTo(this.map);
    }

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('lat').value = lat;
      document.getElementById('lon').value = lng;

      if (marker) {
        this.map.removeLayer(marker);
      }
      marker = L.marker([lat, lng]).addTo(this.map);
    });

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map.setView([latitude, longitude], 13);
          
          if (!initialLat || !initialLon) {
            document.getElementById('lat').value = latitude;
            document.getElementById('lon').value = longitude;
            
            if (marker) {
              this.map.removeLayer(marker);
            }
            marker = L.marker([latitude, longitude]).addTo(this.map);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }

  initDetailMap(lat, lon) {
    const mapContainer = document.getElementById('map-detail');
    if (!mapContainer) return;

    // Clean up existing map
    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }

    this.detailMap = L.map('map-detail').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.detailMap);

    L.marker([lat, lon]).addTo(this.detailMap);
  }

  initStoriesMap() {
    const mapContainer = document.getElementById('map-stories');
    if (!mapContainer) return;

    // Clean up existing map
    if (this.storiesMap) {
      this.storiesMap.remove();
      this.storiesMap = null;
    }

    const storiesWithLocation = this.stories.filter(story => story.lat && story.lon);
    if (storiesWithLocation.length === 0) return;

    this.storiesMap = L.map('map-stories').setView(
      [storiesWithLocation[0].lat, storiesWithLocation[0].lon], 
      10
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.storiesMap);

    storiesWithLocation.forEach(story => {
      const marker = L.marker([story.lat, story.lon]).addTo(this.storiesMap);
      marker.bindPopup(`
        <div style="max-width: 200px;">
          <img src="${story.photoUrl}" alt="${story.name}" style="width: 100%; height: 100px; object-fit: cover;">
          <h4>${story.name}</h4>
          <p>${story.description.substring(0, 100)}...</p>
          <a href="#story-detail-${story.id}" class="btn">Read More</a>
        </div>
      `);
    });
  }
}