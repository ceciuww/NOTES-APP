// Utility functions
export { escapeHtml } from './escape.js';
export { showToast } from './toast.js';

// Global loading functions
export function showGlobalLoading() {
  const loadingElement = document.getElementById('globalLoading');
  if (loadingElement) {
    loadingElement.style.display = 'flex';
  }
}

export function hideGlobalLoading() {
  const loadingElement = document.getElementById('globalLoading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

// Helper function to format date
export function formatDate(dateString) {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Helper function to validate form
export function validateForm(formData, minTitleLength, minBodyLength) {
  const errors = {};
  
  if (!formData.title || formData.title.length < minTitleLength) {
    errors.title = `Judul harus diisi (min. ${minTitleLength} karakter)`;
  }
  
  if (!formData.body || formData.body.length < minBodyLength) {
    errors.body = `Isi catatan harus diisi (min. ${minBodyLength} karakter)`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}