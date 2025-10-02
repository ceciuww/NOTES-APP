export class StoryPresenter {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.currentView = 'home';
        this.stories = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.hasMore = false;
        this.map = null;
        this.detailMap = null;
        this.storiesMap = null;
        this.cameraStream = null;
        this.currentStoryId = null;
        this.init();
    }
 
    init() {
        this.setupEventListeners();
        this.handleRouting();
        this.view.updateAuthUI(this.model.isLoggedIn(), this.model.user?.name);
    }
 
    setupEventListeners() {
        // Set up view event listeners
        this.view.on('hashchange', () => this.handleRouting());
        this.view.on('logout', () => this.handleLogout());
        
        // Set up view's event listeners after DOM is rendered
        this.view.on('viewRendered', () => {
            this.setupViewSpecificEventListeners();
        });
    }
 
    setupViewSpecificEventListeners() {
        // Form submissions
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
 
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
 
        const storyForm = document.getElementById('story-form');
        if (storyForm) {
            storyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddStory();
            });
        }
 
        const updateStoryForm = document.getElementById('update-story-form');
        if (updateStoryForm) {
            updateStoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpdateStory();
            });
        }
 
        // Capture and retake photo buttons
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.capturePhoto();
            });
        }
 
        const retakeBtn = document.getElementById('retake-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => {
                this.retakePhoto();
            });
        }
 
        // Location checkbox
        const useLocation = document.getElementById('use-location');
        if (useLocation) {
            useLocation.addEventListener('change', (e) => {
                this.toggleLocationInput(e.target.checked);
            });
        }
 
        // Delete story buttons
        const deleteStoryBtn = document.getElementById('delete-story');
        if (deleteStoryBtn) {
            deleteStoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDeleteStory(this.currentStoryId);
            });
        }
 
        // Delete story buttons in grid
        const deleteStoryBtns = document.querySelectorAll('.delete-story-btn');
        deleteStoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const storyId = e.target.getAttribute('data-id');
                this.handleDeleteStory(storyId);
            });
        });
 
        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadMoreStories();
            });
        }
    }
 
    async showHome() {
        this.currentView = 'home';
        this.currentPage = 1;
        this.stories = [];
        try {
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
                this.model.user?.userId,
                this.hasMore
            ));
            this.view.trigger('viewRendered');
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
                        this.model.user?.userId,
                        this.hasMore
                    ));
                    this.view.trigger('viewRendered');
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
        this.currentView = 'login';
        this.stopCamera();
        this.view.renderView(this.view.loginView());
        this.view.trigger('viewRendered');
    }
 
    showRegister() {
        this.currentView = 'register';
        this.stopCamera();
        this.view.renderView(this.view.registerView());
        this.view.trigger('viewRendered');
    }
 
    async showAddStory() {
        if (!this.model.isLoggedIn()) {
            this.view.showNotification('Please login to add a story', 'error');
            this.showLogin();
            return;
        }
        
        this.currentView = 'add-story';
        this.view.renderView(this.view.addStoryView());
        this.view.trigger('viewRendered');
        
        await this.initCamera();
    }
 
    async showUpdateStory(storyId) {
        if (!this.model.isLoggedIn()) {
            this.view.showNotification('Please login to update a story', 'error');
            this.showLogin();
            return;
        }
 
        try {
            const response = await this.model.getStoryDetail(storyId);
            if (!response.error && response.story.createdBy === this.model.user.userId) {
                this.currentView = 'update-story';
                this.currentStoryId = storyId;
                this.view.renderView(this.view.updateStoryView(response.story));
                this.view.trigger('viewRendered');
                
                if (response.story.lat && response.story.lon) {
                    this.initLocationMap(response.story.lat, response.story.lon);
                }
            } else {
                this.view.showNotification('You can only update your own stories', 'error');
                this.showHome();
            }
        } catch (error) {
            console.error('Error loading story for update:', error);
            this.view.showNotification('Error loading story', 'error');
            this.showHome();
        }
    }
 
    async showStoryDetail(storyId) {
        try {
            const response = await this.model.getStoryDetail(storyId);
            if (!response.error) {
                const canEdit = this.model.isLoggedIn() && response.story.createdBy === this.model.user?.userId;
                this.currentStoryId = storyId;
                this.view.renderView(this.view.storyDetailView(response.story, canEdit));
                this.view.trigger('viewRendered');
                if (response.story.lat && response.story.lon) {
                    this.initDetailMap(response.story.lat, response.story.lon);
                }
            } else {
                this.view.showNotification('Failed to load story details', 'error');
                this.showHome();
            }
        } catch (error) {
            console.error('Error loading story details:', error);
            this.view.showNotification('Error loading story details', 'error');
            this.showHome();
        }
    }
 
    async showMapView() {
        this.currentView = 'map-view';
        this.stopCamera();
        try {
            if (this.model.isLoggedIn()) {
                const response = await this.model.getStories();
                if (!response.error) this.stories = response.listStory;
            }
            this.view.renderView(this.view.mapView(this.stories));
            this.view.trigger('viewRendered');
            this.initStoriesMap();
        } catch (error) {
            console.error('Error loading stories for map:', error);
            this.view.renderView(this.view.mapView([]));
            this.view.showNotification('Error loading stories for map', 'error');
        }
    }
 
    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const loginBtn = document.getElementById('login-btn');
        const loginText = document.getElementById('login-text');
        const loginLoading = document.getElementById('login-loading');
        
        if (loginBtn && loginText && loginLoading) {
            loginBtn.disabled = true;
            loginText.style.display = 'none';
            loginLoading.style.display = 'inline-block';
        }
        
        try {
            const response = await this.model.login({ email, password });
            if (!response.error) {
                this.model.setAuthToken(response.loginResult.token);
                this.model.setUser({
                    name: response.loginResult.name,
                    userId: response.loginResult.userId
                });
                this.view.updateAuthUI(true, response.loginResult.name);
                this.view.showNotification('Login successful!');
                this.showHome();
            } else {
                this.view.showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.view.showNotification('Login failed. Please try again.', 'error');
        } finally {
            if (loginBtn && loginText && loginLoading) {
                loginBtn.disabled = false;
                loginText.style.display = 'inline-block';
                loginLoading.style.display = 'none';
            }
        }
    }
 
    async handleRegister() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        const registerBtn = document.getElementById('register-btn');
        const registerText = document.getElementById('register-text');
        const registerLoading = document.getElementById('register-loading');
        
        if (registerBtn && registerText && registerLoading) {
            registerBtn.disabled = true;
            registerText.style.display = 'none';
            registerLoading.style.display = 'inline-block';
        }
        
        try {
            const response = await this.model.register({ name, email, password });
            if (!response.error) {
                this.view.showNotification('Registration successful! Please login.');
                this.showLogin();
            } else {
                this.view.showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.view.showNotification('Registration failed. Please try again.', 'error');
        } finally {
            if (registerBtn && registerText && registerLoading) {
                registerBtn.disabled = false;
                registerText.style.display = 'inline-block';
                registerLoading.style.display = 'none';
            }
        }
    }
 
    async handleAddStory() {
        if (!this.model.isLoggedIn()) {
            this.view.showNotification('Please login to share a story', 'error');
            this.showLogin();
            return;
        }
        
        const description = document.getElementById('description').value;
        const photoData = document.getElementById('photo-data').value;
        const useLocation = document.getElementById('use-location').checked;
        const lat = document.getElementById('lat').value;
        const lon = document.getElementById('lon').value;
        
        if (!photoData) {
            this.view.showNotification('Please capture a photo first', 'error');
            return;
        }
        
        const submitBtn = document.getElementById('submit-story-btn');
        const submitText = document.getElementById('submit-story-text');
        const submitLoading = document.getElementById('submit-story-loading');
        
        if (submitBtn && submitText && submitLoading) {
            submitBtn.disabled = true;
            submitText.style.display = 'none';
            submitLoading.style.display = 'inline-block';
        }
        
        try {
            const blob = await fetch(photoData).then(res => res.blob());
            const formData = new FormData();
            formData.append('description', description);
            formData.append('photo', blob, 'story.jpg');
            
            if (useLocation && lat && lon) {
                formData.append('lat', parseFloat(lat));
                formData.append('lon', parseFloat(lon));
            }
            
            const response = await this.model.addStory(formData);
            
            if (!response.error) {
                this.view.showNotification('Story shared successfully!');
                this.showHome();
            } else {
                this.view.showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Error sharing story:', error);
            this.view.showNotification('Failed to share story. Please try again.', 'error');
        } finally {
            if (submitBtn && submitText && submitLoading) {
                submitBtn.disabled = false;
                submitText.style.display = 'inline-block';
                submitLoading.style.display = 'none';
            }
        }
    }
 
    async handleUpdateStory() {
        if (!this.model.isLoggedIn()) {
            this.view.showNotification('Please login to update a story', 'error');
            this.showLogin();
            return;
        }
        
        const description = document.getElementById('description').value;
        const photoData = document.getElementById('photo-data').value;
        const useLocation = document.getElementById('use-location').checked;
        const lat = document.getElementById('lat').value;
        const lon = document.getElementById('lon').value;
        
        const updateBtn = document.getElementById('update-story-btn');
        const updateText = document.getElementById('update-story-text');
        const updateLoading = document.getElementById('update-story-loading');
        
        if (updateBtn && updateText && updateLoading) {
            updateBtn.disabled = true;
            updateText.style.display = 'none';
            updateLoading.style.display = 'inline-block';
        }
        
        try {
            const formData = new FormData();
            formData.append('description', description);
            
            if (photoData) {
                const blob = await fetch(photoData).then(res => res.blob());
                formData.append('photo', blob, 'story.jpg');
            }
            
            if (useLocation && lat && lon) {
                formData.append('lat', parseFloat(lat));
                formData.append('lon', parseFloat(lon));
            } else if (!useLocation) {
                formData.append('lat', '');
                formData.append('lon', '');
            }
            
            const response = await this.model.updateStory(this.currentStoryId, formData);
            
            if (!response.error) {
                this.view.showNotification('Story updated successfully!');
                this.showStoryDetail(this.currentStoryId);
            } else {
                this.view.showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Error updating story:', error);
            this.view.showNotification('Failed to update story. Please try again.', 'error');
        } finally {
            if (updateBtn && updateText && updateLoading) {
                updateBtn.disabled = false;
                updateText.style.display = 'inline-block';
                updateLoading.style.display = 'none';
            }
        }
    }
 
    async handleDeleteStory(storyId) {
        if (!this.model.isLoggedIn()) {
            this.view.showNotification('Please login to delete a story', 'error');
            this.showLogin();
            return;
        }
 
        if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) return;
 
        try {
            const response = await this.model.deleteStory(storyId);
            if (!response.error) {
                this.view.showNotification('Story deleted successfully!');
                this.showHome();
            } else {
                this.view.showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting story:', error);
            this.view.showNotification('Failed to delete story. Please try again.', 'error');
        }
    }
 
    handleLogout() {
        this.stopCamera();
        this.model.logout();
        this.view.updateAuthUI(false);
        this.view.showNotification('Logged out successfully');
        this.showHome();
    }
 
    async initCamera() {
        try {
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(track => track.stop());
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });
            const video = document.getElementById('camera-preview');
            if (video) {
                video.srcObject = stream;
                this.cameraStream = stream;
            } else {
                throw new Error('Video element not found');
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user' }, 
                    audio: false 
                });
                const video = document.getElementById('camera-preview');
                if (video) {
                    video.srcObject = stream;
                    this.cameraStream = stream;
                }
            } catch (fallbackError) {
                console.error('Error accessing any camera:', fallbackError);
                this.view.showNotification('Cannot access camera. Please check permissions or try again.', 'error');
                return false;
            }
        }
        return true;
    }
 
    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('photo-canvas');
        const previewImg = document.getElementById('preview-img');
        const photoPreview = document.getElementById('photo-preview');
        const cameraContainer = document.querySelector('.camera-container');
        
        if (video && canvas && previewImg && photoPreview && cameraContainer) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const photoData = canvas.toDataURL('image/jpeg');
            previewImg.src = photoData;
            document.getElementById('photo-data').value = photoData;
            
            video.style.display = 'none';
            cameraContainer.querySelector('button').style.display = 'none';
            photoPreview.style.display = 'block';
            
            this.stopCamera();
        }
    }
 
    retakePhoto() {
        const video = document.getElementById('camera-preview');
        const photoPreview = document.getElementById('photo-preview');
        const cameraContainer = document.querySelector('.camera-container');
        
        if (video && photoPreview && cameraContainer) {
            video.style.display = 'block';
            cameraContainer.querySelector('button').style.display = 'block';
            photoPreview.style.display = 'none';
            
            this.initCamera();
        }
    }
 
    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }
 
    toggleLocationInput(show) {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.style.display = show ? 'block' : 'none';
            if (show && !this.map) {
                this.initLocationMap();
            }
        }
    }
 
    initLocationMap(lat = -6.2088, lon = 106.8456) {
        const mapElement = document.getElementById('map');
        if (!mapElement || !window.L) return;
        
        if (this.map) {
            this.map.remove();
        }
        
        this.map = L.map('map').setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        const marker = L.marker([lat, lon], { draggable: true }).addTo(this.map);
        
        marker.on('dragend', (e) => {
            const position = marker.getLatLng();
            document.getElementById('lat').value = position.lat;
            document.getElementById('lon').value = position.lng;
        });
        
        this.map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            document.getElementById('lat').value = e.latlng.lat;
            document.getElementById('lon').value = e.latlng.lng;
        });
        
        document.getElementById('lat').value = lat;
        document.getElementById('lon').value = lon;
    }
 
    initDetailMap(lat, lon) {
        const mapElement = document.getElementById('map-detail');
        if (!mapElement || !window.L) return;
        
        if (this.detailMap) {
            this.detailMap.remove();
        }
        
        this.detailMap = L.map('map-detail').setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.detailMap);
        
        L.marker([lat, lon]).addTo(this.detailMap);
    }
 
    initStoriesMap() {
        const mapElement = document.getElementById('map-stories');
        if (!mapElement || !window.L || this.stories.length === 0) return;
        
        if (this.storiesMap) {
            this.storiesMap.remove();
        }
        
        const storiesWithLocation = this.stories.filter(story => story.lat && story.lon);
        if (storiesWithLocation.length === 0) return;
        
        const bounds = new L.LatLngBounds();
        this.storiesMap = L.map('map-stories');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.storiesMap);
        
        storiesWithLocation.forEach(story => {
            const marker = L.marker([story.lat, story.lon]).addTo(this.storiesMap);
            marker.bindPopup(`
                <div style="max-width: 200px;">
                    <img src="${story.photoUrl}" style="width: 100%; height: 100px; object-fit: cover; margin-bottom: 8px;">
                    <h4 style="margin: 0 0 8px;">${story.name}</h4>
                    <p style="margin: 0 0 8px; font-size: 14px;">${story.description.substring(0, 100)}...</p>
                    <a href="#story-detail-${story.id}" style="font-size: 14px;">Read more</a>
                </div>
            `);
            bounds.extend([story.lat, story.lon]);
        });
        
        this.storiesMap.fitBounds(bounds, { padding: [20, 20] });
    }
 
    handleRouting() {
        const hash = window.location.hash;
        
        if (!hash || hash === '#home') {
            this.showHome();
        } else if (hash === '#login') {
            this.showLogin();
        } else if (hash === '#register') {
            this.showRegister();
        } else if (hash === '#add-story') {
            this.showAddStory();
        } else if (hash === '#map-view') {
            this.showMapView();
        } else if (hash.startsWith('#update-story-')) {
            const storyId = hash.split('-')[2];
            this.showUpdateStory(storyId);
        } else if (hash.startsWith('#story-detail-')) {
            const storyId = hash.split('-')[2];
            this.showStoryDetail(storyId);
        } else {
            this.showHome();
        }
    }
}