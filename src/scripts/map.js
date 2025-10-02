import L from 'leaflet';
import { MAP_CONFIG } from './config.js';

// Initialize map
export function initMap(containerId, center = MAP_CONFIG.defaultCenter, zoom = MAP_CONFIG.defaultZoom) {
  const map = L.map(containerId).setView(center, zoom);
  
  L.tileLayer(MAP_CONFIG.tileLayer, {
    attribution: MAP_CONFIG.attribution
  }).addTo(map);
  
  return map;
}

// Add marker to map
export function addMarker(map, latlng, popupContent = '') {
  const marker = L.marker(latlng).addTo(map);
  
  if (popupContent) {
    marker.bindPopup(popupContent);
  }
  
  return marker;
}

// Get current location
export function getCurrentLocation(map) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const latlng = [position.coords.latitude, position.coords.longitude];
        if (map) {
          map.setView(latlng, 13);
        }
        resolve(latlng);
      },
      error => {
        reject(error);
      }
    );
  });
}