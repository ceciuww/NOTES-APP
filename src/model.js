export class StoryModel {
    constructor() {
        this.baseUrl = 'https://story-api.dicoding.dev/v1';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }
 
    async register(userData) {
        const response = await fetch(`${this.baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return response.json();
    }
 
    async login(credentials) {
        const response = await fetch(`${this.baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return response.json();
    }
 
    async getStories(page = 1, size = 20) {
        const response = await fetch(`${this.baseUrl}/stories?page=${page}&size=${size}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return response.json();
    }
 
    async addStory(formData) {
        const response = await fetch(`${this.baseUrl}/stories`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: formData
        });
        return response.json();
    }
 
    async updateStory(storyId, formData) {
        const response = await fetch(`${this.baseUrl}/stories/${storyId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: formData
        });
        return response.json();
    }
 
    async deleteStory(storyId) {
        const response = await fetch(`${this.baseUrl}/stories/${storyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return response.json();
    }
 
    async getStoryDetail(id) {
        const response = await fetch(`${this.baseUrl}/stories/${id}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return response.json();
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
}