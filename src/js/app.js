import L from 'leaflet'; // Assumes Leaflet is installed and imported
import { hideLoading, showLoading, showToast } from "./utils/ui-helper";

class StoryApp {
    // State management
    #currentUser = null;
    #stories = JSON.parse(localStorage.getItem('stories')) || [];
    #currentView = null;
    #currentAnimation = 'page';
    #mapInstance = null;
    #mapMarker = null;

    // DOM Elements
    #viewContainer = document.getElementById('view-container');
    #navLinks = document.querySelectorAll('.nav-link');
    #authLink = document.getElementById('auth-link');
    #drawerButton = document.getElementById("drawer-button"); // Assuming these exist
    #navigationDrawer = document.getElementById("navigation-drawer"); // Assuming these exist
    #overlay = document.getElementById("drawer-overlay"); // Assuming these exist

    // Route definitions
    #routes = {
        '/home': { template: 'home.html', requiresAuth: true },
        '/add-story': { template: 'add-story.html', requiresAuth: true },
        '/map-view': { template: 'map-view.html', requiresAuth: true },
        '/login': { template: 'login.html', requiresAuth: false },
        '/register': { template: 'register.html', requiresAuth: false },
        '/story/:id': { template: 'story-detail.html', requiresAuth: true }
    };

    constructor() {
        this.initApp();
        this._setupDrawer();
    }

    _setupDrawer() {
        this.#drawerButton.addEventListener("click", () => {
            this.#navigationDrawer.classList.toggle("open");
            this.#drawerButton.classList.toggle("open");
            this.#overlay.classList.toggle("visible");
        });
        this.#overlay.addEventListener("click", () => {
            this.#navigationDrawer.classList.remove("open");
            this.#drawerButton.classList.remove("open");
            this.#overlay.classList.remove("visible");
        });

        document.body.addEventListener("click", (event) => {
            if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
                this.#navigationDrawer.classList.remove("open");
                this.#drawerButton.classList.remove("open");
                this.#overlay.classList.remove("visible");
            }
        });
    }

    initApp() {
        // Check for saved user
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.#currentUser = JSON.parse(savedUser);
            this._updateAuthUI();
        }

        this._setupNavigation();
        const initialHash = window.location.hash || '#/home';
        this.navigateTo(initialHash);
        window.addEventListener('hashchange', () => {
            this.navigateTo(window.location.hash);
        });
    }

    _setupNavigation() {
        this.#navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                this.navigateTo(href);
            });
        });
    }

     navigateTo(route) {
    const path = route.replace('#', '');
    const routeInfo = this.#routes[path] || this.#routes['/home'];
    if (routeInfo.requiresAuth && !this.#currentUser) {
      showToast('Please login first', 'error');
      window.location.hash = '#/login';
      return;
    }
    showLoading();
    fetch(`views/${routeInfo.template}`)
      .then((response) => response.text())
      .then((html) => {
        hideLoading(); // sembunyikan overlay dulu
        this._startViewTransition(() => {
          this.#viewContainer.innerHTML = html;
          this._handleNewView(path);
        });
      })
      .catch((error) => {
        hideLoading();
        console.error('Error loading template:', error);
        showToast('Error loading page', 'error');
      });
  }
  _startViewTransition(updateDOM) {
    if (document.startViewTransition) {
      return document.startViewTransition(() => {
        updateDOM();
      });
    } else {
      // fallback kalau browser belum support
      updateDOM();
    }
  }

    _ _handleNewView(path) {
    const newView = this.#viewContainer.firstElementChild;
    newView.id = `view-${Date.now()}`;
    this.#currentView = newView.id;
    hideLoading();
    this._initView(path, newView);
  }

    _initView(route, viewElement) {
        switch (true) {
            case route === '/home':
                this._initHomeView(viewElement);
                break;
            case route === '/add-story':
                this._initAddStoryView(viewElement);
                break;
            case route === '/map-view':
                this._initMapView(viewElement);
                break;
            case route.startsWith('/login'): // Handles both /login and /register as one view
                this._initAuthView(viewElement);
                break;
            case route.startsWith('/story/'):
                const storyId = route.split('/')[2];
                this._initStoryDetailView(viewElement, storyId);
                break;
            default:
                break;
        }
    }

    // View initialization methods
    _initHomeView(viewElement) {
        this._renderStories(viewElement);
        viewElement.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('btn-delete')) {
                const storyId = target.dataset.id;
                this._deleteStory(storyId);
            } else if (target.classList.contains('btn-edit')) {
                showToast('Edit feature coming soon', 'warning');
            } else if (target.closest('.story-card')) {
                const storyId = target.closest('.story-card').dataset.id;
                window.location.hash = `#/story/${storyId}`;
            }
        });
    }

    _initAddStoryView(viewElement) {
        const form = viewElement.querySelector('#story-form');
        const cameraBtn = viewElement.querySelector('#camera-btn');
        const captureBtn = viewElement.querySelector('#capture-btn');
        const video = viewElement.querySelector('#video');
        const capture = viewElement.querySelector('#capture');
        const locationBtn = viewElement.querySelector('#location-btn');
        const mapPreview = viewElement.querySelector('#map-preview');
        const latInput = viewElement.querySelector('#latitude');
        const lngInput = viewElement.querySelector('#longitude');

        let stream = null;

        cameraBtn.addEventListener('click', async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
                video.style.display = 'block';
                capture.style.display = 'none';
                captureBtn.style.display = 'block';
            } catch (error) {
                console.error('Error accessing camera:', error);
                showToast('Cannot access camera', 'error');
            }
        });

        captureBtn.addEventListener('click', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Non-mirrored
            capture.src = canvas.toDataURL('image/png');
            capture.style.display = 'block';
            video.style.display = 'none';
            captureBtn.style.display = 'none';
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        });

        locationBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast('Geolocation is not supported by your browser', 'error');
                return;
            }
            showLoading();
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    latInput.value = lat;
                    lngInput.value = lng;
                    this._setupLocationMap(mapPreview, lat, lng);
                    hideLoading();
                    showToast('Location obtained successfully', 'success');
                },
                (error) => {
                    hideLoading();
                    console.error('Error getting location:', error);
                    showToast('Unable to get your location', 'error');
                }
            );
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const story = {
                id: Date.now().toString(),
                title: formData.get('title'),
                description: formData.get('description'),
                photo: capture.src || '',
                latitude: formData.get('latitude'),
                longitude: formData.get('longitude'),
                createdAt: new Date().toISOString(),
                author: this.#currentUser.name
            };
            this.#stories.push(story);
            localStorage.setItem('stories', JSON.stringify(this.#stories));
            showToast('Story added successfully', 'success');
            setTimeout(() => {
                this.navigateTo('#/home');
            }, 1500);
        });
    }

    _initMapView(viewElement) {
        const mapElement = viewElement.querySelector('#map');
        const map = L.map(mapElement).setView([-6.2, 106.8], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        this.#stories.filter(story => story.latitude && story.longitude).forEach(story => {
            L.marker([parseFloat(story.latitude), parseFloat(story.longitude)])
                .addTo(map)
                .bindPopup(`
                    <h3>${story.title}</h3>
                    <p>${story.description.substring(0, 100)}...</p>
                    <small>By: ${story.author}</small>
                `);
        });
    }

    _initAuthView(viewElement) {
        const loginForm = viewElement.querySelector('#login-form');
        const registerForm = viewElement.querySelector('#register-form');
        const authTabs = viewElement.querySelectorAll('.auth-tab');

        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.auth-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tab.dataset.target).classList.add('active');
            });
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                this.#currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                this._updateAuthUI();
                showToast('Login successful', 'success');
                setTimeout(() => { this.navigateTo('#/home'); }, 1000);
            } else {
                showToast('Invalid email or password', 'error');
            }
        });

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(u => u.email === email)) {
                showToast('User with this email already exists', 'error');
                return;
            }
            const newUser = { name, email, password };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            showToast('Registration successful. Please login.', 'success');
            authTabs[0].click();
            registerForm.reset();
        });
    }

    _initStoryDetailView(viewElement, storyId) {
        const story = this.#stories.find(s => s.id === storyId);
        if (!story) {
            viewElement.innerHTML = this._renderNotFound();
            return;
        }
        viewElement.innerHTML = this._renderStoryDetails(story);
        if (story.latitude && story.longitude) {
            setTimeout(() => {
                const storyMap = L.map('story-map').setView([parseFloat(story.latitude), parseFloat(story.longitude)], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(storyMap);
                L.marker([parseFloat(story.latitude), parseFloat(story.longitude)]).addTo(storyMap).bindPopup(story.title).openPopup();
            }, 100);
        }
    }

    // Helper methods
    _renderStories(container) {
        const storiesContainer = container.querySelector('.stories-container');
        if (this.#stories.length === 0) {
            storiesContainer.innerHTML = this._renderNoStories();
            return;
        }
        storiesContainer.innerHTML = this.#stories.map(story => `
            <div class="story-card" data-id="${story.id}">
                ${story.photo ? `<img src="${story.photo}" alt="${story.title}" class="story-image">` : ''}
                <div class="story-content">
                    <h3 class="story-title">${story.title}</h3>
                    <p class="story-description">${story.description}</p>
                    <div class="story-meta">
                        <span>By ${story.author}</span>
                        <span>${new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="story-actions">
                        <button class="btn btn-primary">Read More</button>
                        ${this.#currentUser && this.#currentUser.email === story.author ? `
                            <button class="btn btn-warning btn-edit" data-id="${story.id}">Edit</button>
                            <button class="btn btn-danger btn-delete" data-id="${story.id}">Delete</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    _deleteStory(storyId) {
        if (confirm('Are you sure you want to delete this story?')) {
            this.#stories = this.#stories.filter(story => story.id !== storyId);
            localStorage.setItem('stories', JSON.stringify(this.#stories));
            if (window.location.hash === '#/home') {
                this._renderStories(document.getElementById(this.#currentView));
            }
            showToast('Story deleted successfully', 'success');
        }
    }

    _updateAuthUI() {
        if (this.#currentUser) {
            this.#authLink.textContent = 'Logout';
            this.#authLink.href = '#/logout';
            this.#authLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.#currentUser = null;
                localStorage.removeItem('currentUser');
                this._updateAuthUI();
                showToast('Logged out successfully', 'success');
                this.navigateTo('#/home');
            }, { once: true });
        } else {
            this.#authLink.textContent = 'Login';
            this.#authLink.href = '#/login';
        }
    }

    _setupLocationMap(mapElement, lat, lng) {
        if (this.#mapInstance) {
            this.#mapInstance.setView([lat, lng], 13);
        } else {
            this.#mapInstance = L.map(mapElement).setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(this.#mapInstance);
        }
        if (this.#mapMarker) {
            this.#mapInstance.removeLayer(this.#mapMarker);
        }
        this.#mapMarker = L.marker([lat, lng]).addTo(this.#mapInstance).bindPopup('Your location').openPopup();
    }
    
    // Static HTML rendering methods
    _renderNotFound() {
        return `
            <div class="access-denied">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Story Not Found</h2>
                <p>The story you're looking for doesn't exist.</p>
                <a href="#/home" class="btn btn-primary">Back to Home</a>
            </div>
        `;
    }

    _renderStoryDetails(story) {
        return `
            <div class="story-detail">
                <div class="story-detail-header">
                    <a href="#/home" class="btn btn-back"><i class="fas fa-arrow-left"></i> Back</a>
                    <h1>${story.title}</h1>
                    <p class="story-meta">By ${story.author} • ${new Date(story.createdAt).toLocaleDateString()}</p>
                </div>
                ${story.photo ? `<img src="${story.photo}" alt="${story.title}" class="story-detail-image">` : ''}
                <div class="story-detail-content">
                    <p>${story.description}</p>
                </div>
                ${story.latitude && story.longitude ? `
                    <div class="story-location">
                        <h3>Location</h3>
                        <div id="story-map" style="height: 300px; border-radius: 10px;"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    _renderNoStories() {
        return `
            <div class="no-stories">
                <i class="fas fa-book-open" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <h2>No Stories Yet</h2>
                <p>Be the first to share your story!</p>
                <a href="#/add-story" class="btn btn-primary">Add Your Story</a>
            </div>
        `;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StoryApp();
});