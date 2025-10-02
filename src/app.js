// src/app.js
import './styles/responsive.css';
import './styles/styles.css';

// Import class yang diperlukan
import { StoryDB } from './js/db.js';
import { PWAInstallManager } from './js/install.js';
import { NotificationManager } from './js/notification.js';
import { OfflineManager } from './js/offline.js';
import { Utils } from './js/utils.js';

// State management
const state = {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    stories: [],
    currentView: 'home',
    stream: null,
    map: null,
    API_BASE_URL: 'https://story-api.dicoding.dev/v1',
    
    // Instances
    storyDB: new StoryDB(),
    notificationManager: new NotificationManager(),
    pwaInstallManager: null,
    offlineManager: null
};

// API Functions
async function fetchStories() {
    try {
        const headers = state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
        const response = await fetch(`${state.API_BASE_URL}/stories`, { headers });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.message || 'Failed to fetch stories');
        return data.listStory || [];
    } catch (error) {
        console.error('Error fetching stories:', error);
        throw error;
    }
}

async function addStory(storyData) {
    try {
        const formData = new FormData();
        formData.append('description', storyData.description);
        if (storyData.photo) formData.append('photo', storyData.photo);
        if (storyData.lat && storyData.lng) {
            formData.append('lat', storyData.lat);
            formData.append('lon', storyData.lng);
        }
        
        const response = await fetch(`${state.API_BASE_URL}/stories`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` },
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add story');
        return data;
    } catch (error) {
        console.error('Error adding story:', error);
        throw error;
    }
}

async function updateStory(id, storyData) {
    try {
        const formData = new FormData();
        formData.append('description', storyData.description);
        if (storyData.photo) formData.append('photo', storyData.photo);
        if (storyData.lat && storyData.lng) {
            formData.append('lat', storyData.lat);
            formData.append('lon', storyData.lng);
        }
        
        const response = await fetch(`${state.API_BASE_URL}/stories/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${state.token}` },
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update story');
        return data;
    } catch (error) {
        console.error('Error updating story:', error);
        throw error;
    }
}

async function deleteStory(id) {
    try {
        const response = await fetch(`${state.API_BASE_URL}/stories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete story');
        return data;
    } catch (error) {
        console.error('Error deleting story:', error);
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${state.API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

async function registerUser(name, email, password) {
    try {
        const response = await fetch(`${state.API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');
        return data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

// Utility Functions
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'default') {
    const toastElement = document.getElementById('toast');
    if (!toastElement) return;
    
    toastElement.textContent = message;
    toastElement.className = `toast ${type}`;
    toastElement.classList.add('show');
    setTimeout(() => toastElement.classList.remove('show'), 3000);
}

// Navigation Functions
function navigateTo(view) {
    const protectedRoutes = ['home', 'add-story', 'map-view'];
    if (protectedRoutes.includes(view) && !state.isLoggedIn) {
        showToast('Please login first to access this page', 'error');
        view = 'login';
    }

    state.currentView = view;
    window.location.hash = view;
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${view}`) link.classList.add('active');
    });
    
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.textContent = state.isLoggedIn ? 'Logout' : 'Login';
        authLink.setAttribute('href', state.isLoggedIn ? '#logout' : '#login');
    }
    
    renderView(view);
}

function renderView(view) {
    if (document.startViewTransition) {
        document.startViewTransition(() => renderViewInternal(view));
    } else {
        renderViewInternal(view);
    }
}

function renderViewInternal(view) {
    showLoading();
    
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) return;
    
    // Clear the view container
    viewContainer.style.opacity = 0;
    viewContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        viewContainer.innerHTML = '';
        
        switch(view) {
            case 'home':
                renderHomeView();
                break;
            case 'add-story':
                renderAddStoryView();
                break;
            case 'map-view':
                renderMapView();
                break;
            case 'login':
                renderLoginView();
                break;
            case 'logout':
                handleLogout();
                break;
            default:
                renderHomeView();
        }
        
        // Animate in the new view
        setTimeout(() => {
            viewContainer.style.opacity = 1;
            viewContainer.style.transform = 'translateY(0)';
            hideLoading();
        }, 50);
    }, 0);
}

// View Rendering Functions
async function renderHomeView() {
    showLoading();
    try {
        const stories = await fetchStories();
        state.stories = stories;
        
        const viewContainer = document.getElementById('view-container');
        if (!viewContainer) return;
        
        const homeView = document.createElement('div');
        homeView.className = 'view active';
        homeView.innerHTML = `
            <h1 class="welcome-message floating">Welcome to Story App</h1>
            <div class="stories-container" id="stories-container">
                ${stories.length > 0 ? stories.map(story => `
                    <div class="story-card" data-id="${story.id}">
                        ${story.photoUrl ? `<img src="${story.photoUrl}" alt="${story.name}" class="story-image">` : ''}
                        <div class="story-content">
                            <h3 class="story-title">${story.name}</h3>
                            <p class="story-description">${story.description}</p>
                            <div class="story-meta">
                                <span>${new Date(story.createdAt).toLocaleDateString()}</span>
                                ${story.lat ? '<span>📍 With Location</span>' : ''}
                            </div>
                            ${state.isLoggedIn ? `
                                <div class="story-actions">
                                    <button class="btn btn-primary" onclick="editStory('${story.id}')">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteStory('${story.id}')">Delete</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : `
                    <p class="access-denied"><i class="fas fa-book-open"></i><br>No stories yet. Be the first to share!</p>
                `}
            </div>
        `;
        viewContainer.appendChild(homeView);
    } catch (error) {
        showToast('Failed to load stories', 'error');
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            viewContainer.innerHTML = `
                <div class="view active">
                    <h1 class="welcome-message">Welcome to Story App</h1>
                    <h2 class="section-title">Recent Stories</h2>
                    <p class="access-denied"><i class="fas fa-exclamation-triangle"></i><br>Failed to load stories. Please try again later.</p>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

function renderAddStoryView() {
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) return;
    
    const addStoryView = document.createElement('div');
    addStoryView.className = 'view active';
    addStoryView.innerHTML = `
        <div class="form-container">
            <h1 class="form-title">Share Your Story</h1>
            <form id="story-form">
                <div class="form-group">
                    <label for="story-name" class="form-label">Story Title</label>
                    <input type="text" id="story-name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="story-description" class="form-label">Story Description</label>
                    <textarea id="story-description" class="form-textarea" required></textarea>
                </div>
                <div class="form-group">
                    <label for="file-upload" class="form-label">Upload Photo</label>
                    <div class="file-upload-container">
                        <input type="file" id="file-upload" class="file-input" accept="image/*" style="display: none;">
                        <label for="file-upload" class="btn btn-primary file-upload-btn">
                            <i class="fas fa-upload"></i> Choose File
                        </label>
                        <span id="file-name" class="file-name">No file chosen</span>
                    </div>
                </div>
                <div class="camera-container">
                    <h2 class="form-subtitle">Or Use Camera</h2>
                    <video id="video" autoplay playsinline></video>
                    <canvas id="capture" style="display: none;"></canvas>
                    <div class="camera-controls">
                        <button type="button" class="btn btn-primary" id="start-camera">
                            <i class="fas fa-camera"></i> Start Camera
                        </button>
                        <button type="button" class="btn btn-warning" id="capture-btn" style="display: none;">
                            <i class="fas fa-camera-retro"></i> Capture Photo
                        </button>
                        <button type="button" class="btn btn-danger" id="stop-camera" style="display: none;">
                            <i class="fas fa-stop"></i> Stop Camera
                        </button>
                    </div>
                </div>
                <div class="location-container">
                    <h2 class="form-subtitle">Location</h2>
                    <div class="location-options">
                        <button type="button" class="btn btn-primary" id="get-location">
                            <i class="fas fa-map-marker-alt"></i> Get Current Location
                        </button>
                        <span class="location-or">OR</span>
                        <p>Click on the map below to select a location</p>
                    </div>
                    <div id="map-preview" style="height: 300px; margin-top: 1rem;"></div>
                    <div class="coordinates-display">
                        <span>Latitude: <span id="lat-value">Not set</span></span>
                        <span>Longitude: <span id="lng-value">Not set</span></span>
                    </div>
                    <input type="hidden" id="story-lat">
                    <input type="hidden" id="story-lng">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">
                    <i class="fas fa-paper-plane"></i> Share Story
                </button>
            </form>
        </div>
    `;
    viewContainer.appendChild(addStoryView);
    
    setupFileUpload();
    setupCamera();
    setupLocation();
    setupStoryForm();
}

function renderMapView() {
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) return;
    
    const mapView = document.createElement('div');
    mapView.className = 'view active';
    mapView.innerHTML = `
        <h1 class="welcome-message">Story Map</h1>
        <h2 class="section-title">Explore Stories by Location</h2>
        <div id="map"></div>
    `;
    viewContainer.appendChild(mapView);
    setTimeout(initMap, 100);
}

function renderLoginView() {
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) return;
    
    const loginView = document.createElement('div');
    loginView.className = 'view active';
    loginView.innerHTML = `
        <h1 class="welcome-message">Authentication</h1>
        <div class="auth-tabs">
            <div class="auth-tab active" data-tab="login">Login</div>
            <div class="auth-tab" data-tab="register">Register</div>
        </div>
        <div class="auth-content active" id="login-content">
            <div class="login-container">
                <h2 class="form-title">Login to Your Account</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-email" class="form-label">Email</label>
                        <input type="email" id="login-email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password" class="form-label">Password</label>
                        <input type="password" id="login-password" class="form-input" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                </form>
            </div>
        </div>
        <div class="auth-content" id="register-content">
            <div class="register-container">
                <h2 class="form-title">Create New Account</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="register-name" class="form-label">Full Name</label>
                        <input type="text" id="register-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email" class="form-label">Email</label>
                        <input type="email" id="register-email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password" class="form-label">Password</label>
                        <input type="password" id="register-password" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="register-confirm" class="form-label">Confirm Password</label>
                        <input type="password" id="register-confirm" class="form-input" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-user-plus"></i> Register
                    </button>
                </form>
            </div>
        </div>
    `;
    viewContainer.appendChild(loginView);
    
    // Setup auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.auth-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-content`).classList.add('active');
        });
    });
    
    // Setup login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            showLoading();
            try {
                const data = await loginUser(email, password);
                state.isLoggedIn = true;
                state.user = data.loginResult;
                state.token = data.loginResult.token;
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(data.loginResult));
                localStorage.setItem('token', data.loginResult.token);
                showToast('Login successful!', 'success');
                navigateTo('home');
            } catch (error) {
                showToast('Login failed: ' + error.message, 'error');
            } finally {
                hideLoading();
            }
        });
    }

    // Setup register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('register-confirm').value;
            
            if (!name || !email || !password || !confirm) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            if (password !== confirm) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            showLoading();
            try {
                await registerUser(name, email, password);
                showToast('Registration successful! Please login.', 'success');
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('[data-tab="login"]').classList.add('active');
                document.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
                document.getElementById('login-content').classList.add('active');
                document.getElementById('login-email').value = email;
                document.getElementById('login-password').value = password;
            } catch (error) {
                showToast('Registration failed: ' + error.message, 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// Setup Functions
function setupFileUpload() {
    const fileInput = document.getElementById('file-upload');
    const fileName = document.getElementById('file-name');
    
    if (fileInput && fileName) {
        fileInput.addEventListener('change', e => {
            if (e.target.files.length > 0) {
                fileName.textContent = e.target.files[0].name;
                stopCamera();
                const canvas = document.getElementById('capture');
                if (canvas) canvas.style.display = 'none';
                const video = document.getElementById('video');
                if (video) video.style.display = 'block';
            } else {
                fileName.textContent = 'No file chosen';
            }
        });
    }
}

function setupCamera() {
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('capture-btn');
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const canvas = document.getElementById('capture');
    
    if (!video || !captureBtn || !startCameraBtn || !stopCameraBtn || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    startCameraBtn.addEventListener('click', async () => {
        try {
            state.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });
            video.srcObject = state.stream;
            startCameraBtn.style.display = 'none';
            captureBtn.style.display = 'block';
            stopCameraBtn.style.display = 'block';
        } catch (err) {
            showToast('Camera access denied: ' + err.message, 'error');
        }
    });
    
    stopCameraBtn.addEventListener('click', stopCamera);
    
    captureBtn.addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        video.style.display = 'none';
        canvas.style.display = 'block';
        stopCamera();
        captureBtn.style.display = 'none';
        stopCameraBtn.style.display = 'none';
        startCameraBtn.style.display = 'block';
        startCameraBtn.textContent = 'Retake Photo';
        
        const fileInput = document.getElementById('file-upload');
        const fileName = document.getElementById('file-name');
        if (fileInput) fileInput.value = '';
        if (fileName) fileName.textContent = 'No file chosen';
    });
}

function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    
    const video = document.getElementById('video');
    const canvas = document.getElementById('capture');
    const startCameraBtn = document.getElementById('start-camera');
    const captureBtn = document.getElementById('capture-btn');
    const stopCameraBtn = document.getElementById('stop-camera');
    
    if (video) video.style.display = 'block';
    if (canvas) canvas.style.display = 'none';
    if (startCameraBtn) {
        startCameraBtn.style.display = 'block';
        startCameraBtn.textContent = 'Start Camera';
    }
    if (captureBtn) captureBtn.style.display = 'none';
    if (stopCameraBtn) stopCameraBtn.style.display = 'none';
}

function setupLocation() {
    const getLocationBtn = document.getElementById('get-location');
    const mapPreview = document.getElementById('map-preview');
    const latInput = document.getElementById('story-lat');
    const lngInput = document.getElementById('story-lng');
    const latValue = document.getElementById('lat-value');
    const lngValue = document.getElementById('lng-value');
    
    if (!getLocationBtn || !mapPreview) return;
    
    let map = null;
    let marker = null;
    
    function initMap() {
        if (!mapPreview) return;
        map = L.map(mapPreview).setView([-2.5489, 118.0149], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        map.on('click', e => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            updateLocation(lat, lng);
            showToast('Location selected from map!', 'success');
        });
    }
    
    function updateLocation(lat, lng) {
        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;
        if (latValue) latValue.textContent = lat.toFixed(6);
        if (lngValue) lngValue.textContent = lng.toFixed(6);
        
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng]).addTo(map)
            .bindPopup('Selected location')
            .openPopup();
        map.setView([lat, lng], 13);
    }
    
    initMap();
    
    getLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }
        
        showLoading();
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                updateLocation(lat, lng);
                hideLoading();
                showToast('Current location captured successfully!', 'success');
            },
            error => {
                hideLoading();
                showToast('Unable to get your location: ' + error.message, 'error');
            }
        );
    });
}

function setupStoryForm() {
    const storyForm = document.getElementById('story-form');
    if (!storyForm) return;
    
    storyForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('story-name').value;
        const description = document.getElementById('story-description').value;
        const lat = document.getElementById('story-lat').value;
        const lng = document.getElementById('story-lng').value;
        const canvas = document.getElementById('capture');
        const fileInput = document.getElementById('file-upload');
        const storyId = storyForm.getAttribute('data-story-id');
        
        if (!name || !description) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        showLoading();
        try {
            let photoFile = null;
            if (fileInput && fileInput.files.length > 0) {
                photoFile = fileInput.files[0];
            } else if (canvas && canvas.style.display !== 'none') {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                photoFile = new File([blob], 'story-photo.jpg', { type: 'image/jpeg' });
            }
            
            const storyData = {
                description: `${name}: ${description}`,
                photo: photoFile,
                lat: lat || null,
                lng: lng || null
            };
            
            if (storyId) {
                await updateStory(storyId, storyData);
                showToast('Story updated successfully!', 'success');
            } else {
                await addStoryWithOfflineSupport(storyData);
                showToast('Story shared successfully!', 'success');
            }
            
            storyForm.reset();
            storyForm.removeAttribute('data-story-id');
            const fileName = document.getElementById('file-name');
            if (fileName) fileName.textContent = 'No file chosen';
            stopCamera();
            const submitBtn = storyForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Share Story';
            setTimeout(() => navigateTo('home'), 1000);
        } catch (error) {
            showToast('Failed to share story: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    });
}

function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    if (state.map) state.map.remove();
    
    const firstStoryWithLocation = state.stories.find(story => story.lat && story.lng);
    const center = firstStoryWithLocation ? [firstStoryWithLocation.lat, firstStoryWithLocation.lng] : [-6.2088, 106.8456];
    
    state.map = L.map('map').setView(center, firstStoryWithLocation ? 10 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);
    
    state.stories.forEach(story => {
        if (story.lat && story.lon) {
            L.marker([story.lat, story.lon]).addTo(state.map)
                .bindPopup(`
                    <h3>${story.name}</h3>
                    <p>${story.description}</p>
                    ${story.photoUrl ? `<img src="${story.photoUrl}" alt="${story.name}" style="max-width: 100%; height: 150px; object-fit: cover;">` : ''}
                `);
        }
    });
}

function handleLogout() {
    state.isLoggedIn = false;
    state.user = null;
    state.token = null;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showToast('Logged out successfully', 'success');
    navigateTo('home');
}

async function editStory(id) {
    const story = state.stories.find(s => s.id === id);
    if (!story) return;
    
    navigateTo('add-story');
    setTimeout(() => {
        const nameInput = document.getElementById('story-name');
        const descInput = document.getElementById('story-description');
        if (nameInput) nameInput.value = story.name;
        if (descInput) descInput.value = story.description;
        
        if (story.lat && story.lng) {
            const latInput = document.getElementById('story-lat');
            const lngInput = document.getElementById('story-lng');
            const latValue = document.getElementById('lat-value');
            const lngValue = document.getElementById('lng-value');
            
            if (latInput) latInput.value = story.lat;
            if (lngInput) lngInput.value = story.lng;
            if (latValue) latValue.textContent = story.lat.toFixed(6);
            if (lngValue) lngValue.textContent = story.lng.toFixed(6);
        }
        
        const form = document.getElementById('story-form');
        if (form) {
            form.setAttribute('data-story-id', id);
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Story';
        }
        showToast('Editing story: ' + story.name, 'success');
    }, 500);
}

async function deleteStoryy(id) {
    if (!confirm('Are you sure you want to delete this story?')) return;
    
    showLoading();
    try {
        await deleteStory(id);
        showToast('Story deleted successfully', 'success');
        state.stories = await fetchStories();
        renderHomeView();
    } catch (error) {
        showToast('Failed to delete story: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Enhanced notification setup
async function setupNotifications() {
    const notificationBtn = document.getElementById('notification-btn');
    
    if (notificationBtn && state.notificationManager) {
        // Initialize notification service
        try {
            await state.notificationManager.init();
            
            notificationBtn.addEventListener('click', async () => {
                try {
                    const isSubscribed = await state.notificationManager.toggleNotifications();
                    
                    if (isSubscribed) {
                        showToast('Notifications enabled! You will receive updates about new stories.', 'success');
                        notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i><span>Disable Notifications</span>';
                        notificationBtn.classList.add('enabled');
                        notificationBtn.classList.remove('disabled');
                    } else {
                        showToast('Notifications disabled', 'info');
                        notificationBtn.innerHTML = '<i class="fas fa-bell"></i><span>Enable Notifications</span>';
                        notificationBtn.classList.remove('enabled');
                        notificationBtn.classList.add('disabled');
                    }
                } catch (error) {
                    console.error('Notification toggle failed:', error);
                    showToast('Notification setup failed: ' + error.message, 'error');
                }
            });

            // Check initial subscription status
            try {
                const isSubscribed = await state.notificationManager.isSubscribed();
                if (isSubscribed) {
                    notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i><span>Disable Notifications</span>';
                    notificationBtn.classList.add('enabled');
                } else {
                    notificationBtn.classList.add('disabled');
                }
            } catch (error) {
                console.error('Error checking subscription status:', error);
            }
        } catch (error) {
            console.error('Notification initialization failed:', error);
            notificationBtn.style.display = 'none';
        }
    }
}

// Register Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                
                // Check for page update
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showToast('New version available! Refresh to update.', 'info');
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

// Enhanced offline story handling
async function addStoryWithOfflineSupport(storyData) {
    if (state.offlineManager && state.offlineManager.isOnline) {
        try {
            return await addStory(storyData);
        } catch (error) {
            // If online but API fails, save for offline sync
            return await saveStoryForOfflineSync(storyData);
        }
    } else {
        // Offline mode - save locally
        return await saveStoryForOfflineSync(storyData);
    }
}

async function saveStoryForOfflineSync(storyData) {
    const localStory = {
        ...storyData,
        localId: Date.now().toString(),
        createdAt: new Date().toISOString(),
        synced: false
    };
    
    await state.storyDB.addOfflineStory(localStory);
    showToast('Story saved offline. Will sync when online.', 'warning');
    return localStory;
}

// Offline sync functionality
async function syncOfflineStories() {
    if (!Utils.isOnline()) return;
    
    try {
        const unsyncedStories = await state.storyDB.getUnsyncedStories();
        
        for (const story of unsyncedStories) {
            try {
                await addStory(story);
                await state.storyDB.markStoryAsSynced(story.localId);
            } catch (error) {
                console.error('Failed to sync story:', error);
            }
        }
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

// Initialize Application
function initApp() {
    // Initialize PWA installation manager
    state.pwaInstallManager = new PWAInstallManager();
    
    // Initialize offline manager
    state.offlineManager = new OfflineManager();
    
    // Setup notifications
    setupNotifications();
    
    // Existing initialization code...
    document.querySelectorAll('[data-nav]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const view = link.getAttribute('href').substring(1);
            navigateTo(view);
        });
    });
    
    window.addEventListener('hashchange', () => {
        const view = window.location.hash.substring(1) || 'home';
        navigateTo(view);
    });
    
    const initialView = window.location.hash.substring(1) || 'home';
    navigateTo(initialView);
    
    // Register service worker for PWA
    registerServiceWorker();
}

// Make functions global for onclick attributes
window.editStory = editStory;
window.deleteStory = deleteStoryy;

document.addEventListener('DOMContentLoaded', initApp);