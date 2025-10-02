// Enhanced Service Worker
const CACHE_NAME = 'story-app-v2.0.0';
const API_CACHE_NAME = 'story-api-v2.0.0';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-72x72.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => console.error('Installation failed:', error))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated successfully');
      return self.clients.claim();
    })
    .catch(error => console.error('Activation failed:', error))
  );
});

// Enhanced Fetch event with better caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests - Network First with Cache Fallback
  if (url.pathname.includes('/v1/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // Static assets - Cache First strategy
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

// Network First Strategy for API calls
async function networkFirstStrategy(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not OK');
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available, return offline page or error
    return new Response(
      JSON.stringify({ 
        error: 'You are offline and no cached data is available',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Cache First Strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return offline page
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Enhanced Push Notification with actions
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New story has been shared!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-96x96.png',
    image: data.image || null,
    data: {
      url: data.url || '/',
      storyId: data.storyId || null
    },
    actions: [
      {
        action: 'view',
        title: '📖 View Story',
        icon: '/assets/icons/icon-72x72.png'
      },
      {
        action: 'share',
        title: '📤 Share',
        icon: '/assets/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss',
        icon: '/assets/icons/icon-72x72.png'
      }
    ],
    tag: data.tag || 'story-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || '📚 Story App',
      options
    ).catch(error => console.error('Notification error:', error))
  );
});

// Enhanced Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notification } = event;
  const { url, storyId } = notification.data;

  event.waitUntil(
    (async () => {
      switch (action) {
        case 'view':
          if (storyId) {
            await openStoryPage(storyId);
          } else {
            await openUrl(url);
          }
          break;

        case 'share':
          if (navigator.share) {
            try {
              await navigator.share({
                title: notification.title,
                text: notification.body,
                url: storyId ? `${url}#story-${storyId}` : url
              });
            } catch (error) {
              console.log('Share cancelled or failed');
            }
          }
          break;

        case 'dismiss':
          console.log('Notification dismissed');
          break;

        default:
          await openUrl(url);
          break;
      }
    })()
  );
});

// Helper function to open story page
async function openStoryPage(storyId) {
  const url = `/#story-${storyId}`;
  return openUrl(url);
}

// Helper function to open URL
async function openUrl(url) {
  const clients = await self.clients.matchAll({ 
    type: 'window',
    includeUncontrolled: true 
  });

  // Check if app is already open
  for (const client of clients) {
    if (client.url.includes(url) && 'focus' in client) {
      return client.focus();
    }
  }

  // Open new window
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

// Background Sync for offline story submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-stories') {
    console.log('Service Worker: Background sync triggered for stories');
    event.waitUntil(syncOfflineStories());
  }
});

// Enhanced offline stories sync
async function syncOfflineStories() {
  try {
    console.log('Service Worker: Syncing offline stories...');
    
    // Get all clients to notify them about sync
    const clients = await self.clients.matchAll();
    
    // Simulate sync process (in real app, this would interact with IndexedDB)
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        timestamp: new Date().toISOString()
      });
    });
    
    // Simulate delay for sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Notify clients about sync completion
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_API_DATA':
      cacheAPIResponse(payload.url, payload.data);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Cache API response helper
async function cacheAPIResponse(url, data) {
  const cache = await caches.open(API_CACHE_NAME);
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put(url, response);
}