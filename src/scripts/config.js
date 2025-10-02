// API Configuration
export const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

// Map Configuration
export const MAP_CONFIG = {
  defaultCenter: [-6.1751, 106.8650], // Jakarta
  defaultZoom: 10,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Application Configuration
export const APP_CONFIG = {
  appName: 'Story App',
  minNameLength: 3,
  minPasswordLength: 8,
  maxImageSize: 1 * 1024 * 1024, // 1MB
  supportedImageTypes: ['image/jpeg', 'image/jpg', 'image/png']
};