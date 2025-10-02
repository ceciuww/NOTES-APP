export function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

export function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

export function showToast(message, type = 'default') {
    const toastElement = document.getElementById('toast');
    if (toastElement) {
        toastElement.textContent = message;
        toastElement.className = `toast ${type}`;
        toastElement.classList.add('show');
        
        setTimeout(() => {
            toastElement.classList.remove('show');
        }, 3000);
    }
}