import { API_BASE_URL } from '../scripts/config.js';

// API service for stories - Pure Model, no DOM manipulation
export class StoryAPI {
  static async register(userData) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const result = await response.json();
    
    if (!result.error) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to register');
    }
  }

  static async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const result = await response.json();
    
    if (!result.error) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to login');
    }
  }

  static async getAllStories(token, page = 1, size = 10, location = 0) {
    const response = await fetch(
      `${API_BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const result = await response.json();
    
    if (!result.error) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to fetch stories');
    }
  }

  static async getStoryDetail(token, storyId) {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const result = await response.json();
    
    if (!result.error) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to fetch story detail');
    }
  }

  static async addStory(token, formData) {
    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.error) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to add story');
    }
  }

  static async addStoryGuest(formData) {
    const response = await fetch(`${API_BASE_URL}/stories/guest`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.error) {
      return result;
    } else {
      throw new Error(result.message || 'Failed to add story as guest');
    }
  }
}