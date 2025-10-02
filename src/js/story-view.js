export class StoryView {
  constructor() {
    this.viewContainer = document.getElementById('view-container');
    this.authLink = document.getElementById('auth-link');
    this.eventListeners = {};
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  trigger(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  renderView(html) {
    if (this.viewContainer) {
      this.viewContainer.innerHTML = html;
      document.getElementById('main').focus();
    }
  }

  updateAuthUI(isLoggedIn, userName = '') {
    if (this.authLink) {
      this.authLink.innerHTML = isLoggedIn
        ? `<i class="fas fa-user"></i> ${userName} (Logout)`
        : '<i class="fas fa-sign-in-alt"></i> Login';
      this.authLink.href = isLoggedIn ? '#logout' : '#login';
    }
  }

  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Improved loading methods
  showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      const text = button.querySelector('.btn-text');
      const loading = button.querySelector('.btn-loading');
      
      if (text && loading) {
        button.disabled = true;
        text.style.display = 'none';
        loading.style.display = 'inline-block';
      }
    }
  }

  hideLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      const text = button.querySelector('.btn-text');
      const loading = button.querySelector('.btn-loading');
      
      if (text && loading) {
        button.disabled = false;
        text.style.display = 'inline-block';
        loading.style.display = 'none';
      }
    }
  }

  // Specific loading methods for different buttons
  showSubmitLoading() {
    this.showLoading('submit-story-btn');
  }

  hideSubmitLoading() {
    this.hideLoading('submit-story-btn');
  }

  showUpdateLoading() {
    this.showLoading('update-story-btn');
  }

  hideUpdateLoading() {
    this.hideLoading('update-story-btn');
  }

  showLoginLoading() {
    this.showLoading('login-btn');
  }

  hideLoginLoading() {
    this.hideLoading('login-btn');
  }

  showRegisterLoading() {
    this.showLoading('register-btn');
  }

  hideRegisterLoading() {
    this.hideLoading('register-btn');
  }

  // Photo preview methods
  togglePhotoPreview(show) {
    const photoPreview = document.getElementById('photo-preview');
    const cameraPreview = document.getElementById('camera-preview');
    const captureBtn = document.getElementById('capture-btn');
    
    if (photoPreview && cameraPreview && captureBtn) {
      photoPreview.style.display = show ? 'block' : 'none';
      cameraPreview.style.display = show ? 'none' : 'block';
      captureBtn.style.display = show ? 'none' : 'block';
    }
  }

  setPhotoData(imageData) {
    const photoData = document.getElementById('photo-data');
    if (photoData) {
      photoData.value = imageData;
    }
  }

  updatePhotoPreview(imageData) {
    const previewImg = document.getElementById('preview-img');
    if (previewImg && imageData) {
      previewImg.src = imageData;
      this.togglePhotoPreview(true);
    }
  }

  // Map container toggle
  toggleMapContainer(show) {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.style.display = show ? 'block' : 'none';
    }
  }

  // Template methods (unchanged from original)
  storyItemTemplate(story, isLoggedIn = false, currentUserId = null) {
    const canEdit = isLoggedIn && currentUserId === story.createdBy;
    
    return `
      <article class="card story-card">
        <img src="${story.photoUrl}" alt="Story by ${story.name}" class="story-image">
        <div class="story-content">
          <h3 class="story-title">${story.name}</h3>
          <p class="story-description">${story.description}</p>
          <div class="story-meta">
            <span><i class="fas fa-calendar"></i> ${new Date(story.createdAt).toLocaleDateString()}</span>
            <span><i class="fas fa-user"></i> ${story.name}</span>
          </div>
        </div>
        <div class="card-footer">
          <a href="#story-detail-${story.id}" class="btn">Read More</a>
          ${canEdit ? `
            <div class="action-buttons">
              <a href="#update-story-${story.id}" class="btn btn-warning"><i class="fas fa-edit"></i></a>
              <button class="btn btn-danger delete-story-btn" data-id="${story.id}"><i class="fas fa-trash"></i></button>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  renderStories(stories, isLoggedIn = false, currentUserId = null, hasMore = false) {
    if (stories.length === 0) {
      return `
        <div class="empty-state">
          <i class="fas fa-book-open"></i>
          <h3>No Stories Yet</h3>
          <p>Be the first to share your story!</p>
          ${isLoggedIn ? `
            <a href="#add-story" class="btn">Add Your First Story</a>
          ` : `
            <a href="#login" class="btn">Login to Add Story</a>
          `}
        </div>
      `;
    }

    return `
      <div class="grid">
        ${stories.map(story => this.storyItemTemplate(story, isLoggedIn, currentUserId)).join('')}
      </div>
      ${hasMore ? 
        `<div class="load-more-container" style="text-align: center; margin-top: 1rem;">
          <button id="loadMoreBtn" class="btn"><i class="fas fa-plus"></i> Load More</button>
        </div>` : ''}
    `;
  }

  homeView(stories = [], isLoggedIn = false, currentUserId = null, hasMore = false) {
    return `
      <section id="home" class="view-transition">
        <div class="card">
          <div class="card-header">
            ${isLoggedIn ? `
              <a href="#add-story" class="btn"><i class="fas fa-plus"></i> Add Story</a>
            ` : ''}
          </div>
          <div class="card-body">
            ${this.renderStories(stories, isLoggedIn, currentUserId, hasMore)}
          </div>
        </div>
      </section>
    `;
  }

  loginView() {
    return `
      <section id="login" class="auth-container view-transition">
        <h2 class="auth-title">Login to Your Account</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit" class="btn" style="width: 100%" id="login-btn">
            <span class="btn-text">Login</span>
            <span class="btn-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
          </button>
        </form>
        <p style="text-align: center; margin-top: 1rem;">
          Don't have an account? <a href="#register">Register here</a>
        </p>
      </section>
    `;
  }

  registerView() {
    return `
      <section id="register" class="auth-container view-transition">
        <h2 class="auth-title">Create an Account</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="reg-name">Name</label>
            <input type="text" id="reg-name" name="name" required>
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" name="email" required>
          </div>
          <div class="form-group">
            <label for="reg-password">Password (min. 8 characters)</label>
            <input type="password" id="reg-password" name="password" minlength="8" required>
          </div>
          <button type="submit" class="btn" style="width: 100%" id="register-btn">
            <span class="btn-text">Register</span>
            <span class="btn-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
          </button>
        </form>
        <p style="text-align: center; margin-top: 1rem;">
          Already have an account? <a href="#login">Login here</a>
        </p>
      </section>
    `;
  }

  addStoryView() {
    return `
      <section id="add-story" class="view-transition">
        <div class="card">
          <div class="card-header">
            <h2>Share Your Story</h2>
            <a href="#home" class="btn">Back to Stories</a>
          </div>
          <div class="card-body">
            <form id="story-form">
              <div class="form-group">
                <label for="description">Story Description</label>
                <textarea id="description" name="description" rows="4" required placeholder="Share your story..."></textarea>
              </div>
              <div class="camera-container">
                <video id="camera-preview" autoplay playsinline></video>
                <button type="button" id="capture-btn" class="btn"><i class="fas fa-camera"></i> Capture Photo</button>
                <canvas id="photo-canvas" style="display: none;"></canvas>
              </div>
              <div id="photo-preview" style="display: none; text-align: center; margin: 1rem 0;">
                <img id="preview-img" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                <button type="button" id="retake-btn" class="btn btn-warning" style="margin-top: 0.5rem;"><i class="fas fa-redo"></i> Retake Photo</button>
              </div>
              <div class="form-group">
                <label for="use-location">
                  <input type="checkbox" id="use-location" name="useLocation">
                  Include my location
                </label>
              </div>
              <div id="map-container" style="display: none;">
                <div id="map"></div>
                <p style="text-align: center; margin-top: 0.5rem; font-size: 0.9rem;">
                  Click on the map to select your story location
                </p>
              </div>
              <input type="hidden" id="lat" name="lat">
              <input type="hidden" id="lon" name="lon">
              <input type="hidden" id="photo-data" name="photo">
              <button type="submit" class="btn" style="width: 100%" id="submit-story-btn">
                <span class="btn-text">Share Story</span>
                <span class="btn-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
              </button>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  updateStoryView(story) {
    return `
      <section id="update-story" class="view-transition">
        <div class="card">
          <div class="card-header">
            <h2>Update Your Story</h2>
            <a href="#story-detail-${story.id}" class="btn">Back to Story</a>
          </div>
          <div class="card-body">
            <form id="update-story-form">
              <div class="form-group">
                <label for="description">Story Description</label>
                <textarea id="description" name="description" rows="4" required>${story.description}</textarea>
              </div>
              <div class="camera-container">
                <div id="current-photo-container">
                  <p>Current Photo:</p>
                  <img id="current-photo" src="${story.photoUrl}" style="width: 100%; max-width: 400px; height: 300px; object-fit: cover; margin-bottom: 1rem; border-radius: 8px;">
                </div>
                <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                <button type="button" id="capture-btn" class="btn"><i class="fas fa-camera"></i> Change Photo</button>
                <canvas id="photo-canvas" style="display: none;"></canvas>
              </div>
              <div id="photo-preview" style="display: none; text-align: center; margin: 1rem 0;">
                <p>New Photo Preview:</p>
                <img id="preview-img" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                <button type="button" id="retake-btn" class="btn btn-warning" style="margin-top: 0.5rem;"><i class="fas fa-redo"></i> Retake Photo</button>
              </div>
              <div class="form-group">
                <label for="use-location">
                  <input type="checkbox" id="use-location" name="useLocation" ${story.lat && story.lon ? 'checked' : ''}>
                  Include my location
                </label>
              </div>
              <div id="map-container" style="${story.lat && story.lon ? 'display: block;' : 'display: none;'}">
                <div id="map"></div>
                <p style="text-align: center; margin-top: 0.5rem; font-size: 0.9rem;">
                  Click on the map to select your story location
                </p>
              </div>
              <input type="hidden" id="lat" name="lat" value="${story.lat || ''}">
              <input type="hidden" id="lon" name="lon" value="${story.lon || ''}">
              <input type="hidden" id="photo-data" name="photo">
              <button type="submit" class="btn" style="width: 100%" id="update-story-btn">
                <span class="btn-text">Update Story</span>
                <span class="btn-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
              </button>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  storyDetailView(story, canEdit = false) {
    return `
      <section id="story-detail" class="view-transition">
        <div class="card">
          <div class="card-header">
            <h2>Story Details</h2>
            <a href="#home" class="btn">Back to Stories</a>
          </div>
          <img src="${story.photoUrl}" alt="Story by ${story.name}" style="width: 100%; max-height: 400px; object-fit: cover;">
          <div class="card-body">
            <div style="margin-bottom: 1rem;">
              <h3>${story.name}</h3>
              <p class="story-meta">
                <span><i class="fas fa-calendar"></i> ${new Date(story.createdAt).toLocaleDateString()}</span>
                <span><i class="fas fa-user"></i> ${story.name}</span>
              </p>
            </div>
            <p>${story.description}</p>
            ${story.lat && story.lon ? `
              <div class="form-group" style="margin-top: 1.5rem;">
                <h4>Story Location</h4>
                <div id="map-detail" style="height: 300px;"></div>
              </div>
            ` : ''}
          </div>
          <div class="card-footer">
            ${canEdit ? `
              <div class="story-actions">
                <a href="#update-story-${story.id}" class="btn btn-success"><i class="fas fa-edit"></i> Edit Story</a>
                <button class="btn btn-danger" id="delete-story"><i class="fas fa-trash"></i> Delete Story</button>
              </div>
            ` : ''}
          </div>
        </div>
        </section>
    `;
  }

  mapView(stories = []) {
    return `
      <section id="map-view" class="view-transition">
        <div class="card">
          <div class="card-header">
            <h2>Stories Map</h2>
            <a href="#home" class="btn">Back to Stories</a>
          </div>
          <div class="card-body">
            ${stories.length > 0 && stories.some(story => story.lat && story.lon) ? `
              <div id="map-stories" style="height: 500px;"></div>
            ` : `
              <div class="empty-state">
                <i class="fas fa-map-marked-alt"></i>
                <h3>No Stories with Location</h3>
                <p>No stories have location data yet.</p>
                <a href="#add-story" class="btn">Add a Story with Location</a>
              </div>
            `}
          </div>
        </div>
      </section>
    `;
  }

  // Setup event listeners for each view
  setupHomeEventListeners() {
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.trigger('loadMore');
      });
    }

    // Delete story buttons
    document.querySelectorAll('.delete-story-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const storyId = btn.getAttribute('data-id');
        this.trigger('deleteStory', storyId);
      });
    });
  }

  setupLoginEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const credentials = Object.fromEntries(formData.entries());
        this.trigger('login', credentials);
      });
    }
  }

  setupRegisterEventListeners() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const userData = Object.fromEntries(formData.entries());
        this.trigger('register', userData);
      });
    }
  }

  setupAddStoryEventListeners() {
    const storyForm = document.getElementById('story-form');
    if (storyForm) {
      storyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(storyForm);
        const storyData = Object.fromEntries(formData.entries());
        this.trigger('addStory', storyData);
      });
    }

    // Camera functionality
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        this.trigger('capturePhoto');
      });
    }

    const retakeBtn = document.getElementById('retake-btn');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        this.trigger('retakePhoto');
      });
    }

    const useLocation = document.getElementById('use-location');
    if (useLocation) {
      useLocation.addEventListener('change', (e) => {
        this.trigger('toggleLocation', e.target.checked);
      });
    }
  }

  setupUpdateStoryEventListeners() {
    const updateForm = document.getElementById('update-story-form');
    if (updateForm) {
      updateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(updateForm);
        const storyData = Object.fromEntries(formData.entries());
        this.trigger('updateStory', storyData);
      });
    }

    // Camera functionality
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        this.trigger('capturePhoto');
      });
    }

    const retakeBtn = document.getElementById('retake-btn');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        this.trigger('retakePhoto');
      });
    }

    const useLocation = document.getElementById('use-location');
    if (useLocation) {
      useLocation.addEventListener('change', (e) => {
        this.trigger('toggleLocation', e.target.checked);
      });
    }
  }

  setupStoryDetailEventListeners() {
    const deleteBtn = document.getElementById('delete-story');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.trigger('deleteStory');
      });
    }
  }
}