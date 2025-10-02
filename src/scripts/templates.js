import { escapeHtml, formatDate } from '../utils/index.js';

// Template for story item
export function storyItemTemplate(story) {
  const date = story.createdAt ? formatDate(story.createdAt) : '';
  
  return `
    <div class="story-item" data-id="${story.id}">
      <div class="story-image">
        <img src="${story.photoUrl}" alt="Story by ${escapeHtml(story.name)}" loading="lazy">
        ${story.lat && story.lon ? `
          <div class="story-location">
            <i class="fas fa-map-marker-alt"></i>
            <span>Lokasi tersedia</span>
          </div>
        ` : ''}
      </div>
      <div class="story-content">
        <h3>${escapeHtml(story.name)}</h3>
        <p class="story-description">${escapeHtml(story.description)}</p>
        <div class="story-meta">
          <span class="story-date"><i class="fas fa-calendar"></i> ${date}</span>
          ${story.lat && story.lon ? `
            <span class="story-coordinates">
              <i class="fas fa-globe"></i> ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Template for empty state
export function emptyStateTemplate(message) {
  return `
    <div class="empty-state">
      <i class="fas fa-book-open"></i>
      <p>${message}</p>
    </div>
  `;
}

// Template for loading indicator
export function loadingIndicatorTemplate() {
  return `
    <div class="loading-indicator">
      <div class="loading-spinner"></div>
      <p>Memuat...</p>
    </div>
  `;
}

// Template for login form
export function loginFormTemplate() {
  return `
    <div class="auth-form">
      <h2><i class="fas fa-sign-in-alt"></i> Masuk</h2>
      <form id="loginForm">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" class="form-control" placeholder="Masukkan email" required>
          <div class="error-message" id="emailError"></div>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" class="form-control" placeholder="Masukkan password" required>
          <div class="error-message" id="passwordError"></div>
        </div>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-sign-in-alt"></i> Masuk
        </button>
      </form>
      <p class="auth-switch">
        Belum punya akun? <a href="#register" class="auth-link">Daftar di sini</a>
      </p>
    </div>
  `;
}

// Template for register form
export function registerFormTemplate() {
  return `
    <div class="auth-form">
      <h2><i class="fas fa-user-plus"></i> Daftar</h2>
      <form id="registerForm">
        <div class="form-group">
          <label for="name">Nama</label>
          <input type="text" id="name" class="form-control" placeholder="Masukkan nama" required>
          <div class="error-message" id="nameError"></div>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" class="form-control" placeholder="Masukkan email" required>
          <div class="error-message" id="emailError"></div>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" class="form-control" placeholder="Masukkan password (min. 8 karakter)" required>
          <div class="error-message" id="passwordError"></div>
        </div>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-user-plus"></i> Daftar
        </button>
      </form>
      <p class="auth-switch">
        Sudah punya akun? <a href="#login" class="auth-link">Masuk di sini</a>
      </p>
    </div>
  `;
}

// Template for add story form
export function addStoryFormTemplate() {
  return `
    <div class="story-form">
      <h2><i class="fas fa-plus-circle"></i> Tambah Cerita Baru</h2>
      <form id="storyForm" enctype="multipart/form-data">
        <div class="form-group">
          <label for="description">Deskripsi</label>
          <textarea id="description" class="form-control" placeholder="Tulis deskripsi cerita Anda..." required rows="4"></textarea>
          <div class="error-message" id="descriptionError"></div>
        </div>
        
        <div class="form-group">
          <label for="photo">Foto</label>
          <div class="file-input-group">
            <input type="file" id="photo" accept="image/*" capture="camera" required>
            <label for="photo" class="file-input-label">
              <i class="fas fa-camera"></i> Ambil Foto atau Pilih dari Galeri
            </label>
          </div>
          <div class="error-message" id="photoError"></div>
          <div id="photoPreview" class="photo-preview"></div>
        </div>
        
        <div class="form-group">
          <label for="location">Lokasi (Opsional)</label>
          <div class="location-controls">
            <button type="button" id="getLocationBtn" class="btn btn-secondary">
              <i class="fas fa-map-marker-alt"></i> Dapatkan Lokasi Saat Ini
            </button>
            <span id="locationStatus" class="location-status">Lokasi belum diambil</span>
          </div>
          <input type="hidden" id="latitude">
          <input type="hidden" id="longitude">
        </div>
        
        <div id="mapContainer" class="map-container" style="display: none;">
          <div id="storyMap" style="height: 300px;"></div>
          <p class="map-instruction">Klik pada peta untuk memilih lokasi</p>
        </div>
        
        <div class="form-actions">
          <button type="button" id="cancelBtn" class="btn btn-secondary">Batal</button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-plus"></i> Tambah Cerita
          </button>
        </div>
      </form>
    </div>
  `;
}