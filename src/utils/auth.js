export class Auth {
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  static isLoggedIn() {
    return !!this.getToken();
  }
}