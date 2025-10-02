// src/js/offline.js
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupOnlineOfflineListeners();
        this.setupBackgroundSync();
    }

    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });

        // Initial check
        if (!this.isOnline) {
            this.handleOffline();
        }
    }

    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                // Register background sync
                registration.sync.register('background-sync-stories')
                    .then(() => console.log('Background sync registered'))
                    .catch(err => console.log('Background sync registration failed:', err));
            });
        }
    }

    handleOnline() {
        console.log('App is online');
        this.showOnlineStatus();
        this.syncOfflineData();
    }

    handleOffline() {
        console.log('App is offline');
        this.showOfflineStatus();
    }

    showOnlineStatus() {
        this.showToast('You are back online!', 'success');
    }

    showOfflineStatus() {
        this.showToast('You are currently offline. Some features may be limited.', 'warning');
    }

    showToast(message, type) {
        // Use existing toast functionality
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    async syncOfflineData() {
        try {
            // Sync offline stories
            if (window.state && window.state.storyDB) {
                const unsyncedStories = await window.state.storyDB.getUnsyncedStories();
                
                for (const story of unsyncedStories) {
                    try {
                        await this.syncStory(story);
                        await window.state.storyDB.markStoryAsSynced(story.localId);
                    } catch (error) {
                        console.error('Failed to sync story:', error);
                    }
                }
                
                if (unsyncedStories.length > 0) {
                    this.showToast(`${unsyncedStories.length} offline stories synced!`, 'success');
                }
            }
        } catch (error) {
            console.error('Offline data sync failed:', error);
        }
    }

    async syncStory(story) {
        // Implement story synchronization with server
        // This would call your API to save the story
        console.log('Syncing story:', story);
        
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 1000);
        });
    }

    // Cache API responses for offline use
    async cacheAPIResponse(url, data) {
        if ('caches' in window) {
            const cache = await caches.open('api-cache-v1');
            const response = new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });
            await cache.put(url, response);
        }
    }

    // Get cached API response
    async getCachedAPIResponse(url) {
        if ('caches' in window) {
            const cache = await caches.open('api-cache-v1');
            const response = await cache.match(url);
            if (response) {
                return response.json();
            }
        }
        return null;
    }
}

export { OfflineManager };
