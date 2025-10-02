export class StoryModel {
  constructor() {
    this.baseUrl = 'https://story-api.dicoding.dev/v1';
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      return { error: true, message: 'Network error' };
    }
  }

  async login(credentials) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return await response.json();
    } catch (error) {
      return { error: true, message: 'Network error' };
    }
  }

  async getStories(page = 1, size = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/stories?page=${page}&size=${size}`, {
        headers: { 
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        }
      });
      return await response.json();
    } catch (error) {
      return { error: true, message: 'Network error' };
    }
  }

  async addStory(formData) {
    try {
      const response = await fetch(`${this.baseUrl}/stories`, {
        method: 'POST',
        headers: { 
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        },
        body: formData
      });
      return await response.json();
    } catch (error) {
      return { error: true, message: 'Network error' };
    }
  }

  async updateStory(storyId, formData) {
    try {
      const response = await fetch(`${this.baseUrl}/stories/${storyId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        },
        body: formData
      });
      return await response.json();
    } catch (error) {
      return { error: true, message: 'Network error' };
    }
  }

  async deleteStory(storyId) {
    try {
      const response = await fetch(`${this.baseUrl}/stories/${storyId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        }
      });
      return await response.json();
    } catch (error) {
      return { error: true, message: 'Network error' };
    }
  }

  async getStoryDetail(id) {
    try {
      const response = await fetch(`${this.baseUrl}/stories/${id}`, {
        headers: { 
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        }
      });
      return await response.json();
    } catch (error) {
      return { error: true, message: 'Network error' };
    }
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn() {
    return !!this.token;
  }

  getCurrentUserId() {
    return this.user?.userId || null;
  }

  getCurrentUser() {
    return this.user;
  }
}