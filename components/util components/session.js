export default class SessionManager {
    static getUserId() {
        // We can store the current active user ID in a non-specific key just to know WHO is logged in context, 
        // but for retrieving data we rely on the passed userId usually.
        // For simpler migration, we'll store 'current_user_id' in sessionStorage or localStorage
        return sessionStorage.getItem('current_active_user');
    }

    static setCurrentUser(username) {
        sessionStorage.setItem('current_active_user', username);
    }

    static getKey(key) {
        const username = this.getUserId();
        if (!username) return key; // Fallback for pre-login or global items
        return `${username}_${key}`;
    }

    // Generic Get
    static getItem(key) {
        const userKey = this.getKey(key);
        return localStorage.getItem(userKey);
    }

    // Generic Set
    static setItem(key, value) {
        const userKey = this.getKey(key);
        localStorage.setItem(userKey, value);
    }

    // Specific Getters for known system properties (with defaults)
    static getBackgroundImage(username) {
        const key = `${username}_bg-image`;
        return localStorage.getItem(key) || "wall-8"; // Default wallpaper
    }

    static getDesktopApps(username) {
        const key = `${username}_desktop_apps`;
        return JSON.parse(localStorage.getItem(key) || "[]");
    }

    static getFolders(username) {
        const key = `${username}_new_folders`;
        return JSON.parse(localStorage.getItem(key) || "[]");
    }
}
