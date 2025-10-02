// src/js/db.js
const DB_NAME = 'StoryAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'stories';
const OFFLINE_STORE = 'offline_stories';

class StoryDB {
  constructor() {
    this.db = null;
  }

  // Open database connection
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stories store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }

        // Create offline stories store for sync
        if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
          const offlineStore = db.createObjectStore(OFFLINE_STORE, { 
            keyPath: 'localId', 
            autoIncrement: true 
          });
          offlineStore.createIndex('synced', 'synced', { unique: false });
          offlineStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // CRUD Operations for Stories
  async addStory(story) {
    if (!this.db) await this.open();
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return store.add(story);
  }

  async getStory(id) {
    if (!this.db) await this.open();
    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return store.get(id);
  }

  async getAllStories() {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateStory(story) {
    if (!this.db) await this.open();
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return store.put(story);
  }

  async deleteStory(id) {
    if (!this.db) await this.open();
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return store.delete(id);
  }

  // Offline Sync Operations
  async addOfflineStory(story) {
    if (!this.db) await this.open();
    const transaction = this.db.transaction([OFFLINE_STORE], 'readwrite');
    const store = transaction.objectStore(OFFLINE_STORE);
    return store.add({
      ...story,
      synced: false,
      createdAt: new Date().toISOString()
    });
  }

  async getUnsyncedStories() {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORE], 'readonly');
      const store = transaction.objectStore(OFFLINE_STORE);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markStoryAsSynced(localId) {
    if (!this.db) await this.open();
    const transaction = this.db.transaction([OFFLINE_STORE], 'readwrite');
    const store = transaction.objectStore(OFFLINE_STORE);
    const story = await store.get(localId);
    
    if (story) {
      story.synced = true;
      return store.put(story);
    }
  }

  // Advanced features: Search, Filter, Sort
  async searchStories(query) {
    const stories = await this.getAllStories();
    return stories.filter(story => 
      story.name?.toLowerCase().includes(query.toLowerCase()) ||
      story.description?.toLowerCase().includes(query.toLowerCase())
    );
  }

  async filterStoriesByDate(startDate, endDate) {
    const stories = await this.getAllStories();
    return stories.filter(story => {
      const storyDate = new Date(story.createdAt);
      return storyDate >= startDate && storyDate <= endDate;
    });
  }

  async sortStories(sortBy = 'createdAt', ascending = false) {
    const stories = await this.getAllStories();
    return stories.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (ascending) {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
}

// Export class, bukan instance
export { StoryDB };
