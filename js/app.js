// app.js
// At the top of app.js, add:
import { Auth } from './Auth.js';
import { Database } from './db.js';
import { GoalsView } from './views/goals.js';
class LifestyleTrackerApp {
    constructor() {
        this.db = new Database();
        this.auth = null;
        this.cryptoKey = null;
        this.currentRoute = null;
        this.isOnline = navigator.onLine;
        this.baseUrl = '/lifestyle-tracker'; // GitHub Pages base path

        // State management
        this.state = {
            user: null,
            settings: null,
            currentView: null,
            isLoading: false,
            notifications: {
                enabled: false,
                permission: null
            }
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.handleRoute = this.handleRoute.bind(this);
        this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
    }

    async init() {
        try {
            this.state.isLoading = true;
            this.renderLoadingState();

            // Initialize database
            await this.db.init();

            // Initialize authentication
            this.auth = new Auth(this.db);

            // Register service worker
            await this.registerServiceWorker();

            // Set up event listeners
            this.setupEventListeners();

            // Check for existing session
            await this.checkExistingSession();

            // Handle initial route
            await this.handleRoute(window.location.pathname);

            this.state.isLoading = false;
            this.render();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register(
                    `${this.baseUrl}/sw.js`,
                    { scope: this.baseUrl + '/' }
                );
                console.log('ServiceWorker registration successful');

                // Set up notification permission
                if ('Notification' in window) {
                    this.state.notifications.permission = Notification.permission;
                    if (Notification.permission === 'granted') {
                        this.state.notifications.enabled = true;
                    }
                }
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }

    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);

        // Navigation
        window.addEventListener('popstate', (event) => {
            this.handleRoute(window.location.pathname);
        });

        // Handle clicks on navigation elements
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-route]')) {
                event.preventDefault();
                const route = event.target.getAttribute('data-route');
                this.navigateTo(route);
            }
        });
    }

    updateOnlineStatus() {
        this.isOnline = navigator.onLine;
        this.render();

        // Show appropriate notification
        const message = this.isOnline ?
            'Back online - syncing data' :
            'You are offline - changes will be saved locally';
        this.showNotification(message);
    }

    async checkExistingSession() {
        // Check localStorage for session token
        const sessionToken = localStorage.getItem('sessionToken');
        if (sessionToken) {
            try {
                // Validate session and retrieve user data
                const userData = await this.auth.validateSession(sessionToken);
                if (userData) {
                    this.state.user = userData;
                    // Load user settings
                    this.state.settings = await this.db.getDecryptedData(
                        'settings',
                        this.cryptoKey
                    );
                }
            } catch (error) {
                // Invalid or expired session
                localStorage.removeItem('sessionToken');
                this.state.user = null;
            }
        }
    }

    async handleRoute(pathname) {
        // Remove base path for GitHub Pages
        const route = pathname.replace(this.baseUrl, '');

        // Define routes
        const routes = {
            '/': 'home',
            '/login': 'login',
            '/signup': 'signup',
            '/dashboard': 'dashboard',
            '/entries': 'entries',
            '/goals': 'goals',
            '/settings': 'settings'
        };

        // Get view name from routes or default to 404
        const view = routes[route] || '404';

        // Check if view requires authentication
        const publicViews = ['login', 'signup', '404'];
        if (!publicViews.includes(view) && !this.state.user) {
            this.navigateTo('/login');
            return;
        }

        this.state.currentView = view;
        this.render();
    }

    navigateTo(route) {
        const url = `${this.baseUrl}${route}`;
        window.history.pushState({}, '', url);
        this.handleRoute(route);
    }

    render() {
        // Clear loading state if present
        if (!this.state.isLoading) {
            this.clearLoadingState();
        }

        // Get main container
        const mainContainer = document.getElementById('main-content'); // Use 'main-content'
        if (!mainContainer) return;

        // Render offline indicator if needed
        this.renderOfflineIndicator();

        // Render current view
        switch (this.state.currentView) {
            case 'home':
                this.renderHome(mainContainer);
                break;
            case 'login':
                this.renderLogin(mainContainer);
                break;
            case 'signup':
                this.renderSignup(mainContainer);
                break;
            case 'dashboard':
                this.renderDashboard(mainContainer);
                break;
            case 'entries':
                this.renderEntries(mainContainer);
                break;
            case 'goals':
                this.renderGoals(mainContainer);
                break;
            case 'settings':
                this.renderSettings(mainContainer);
                break;
            default:
                this.render404(mainContainer);
        }
    }

    renderLoadingState() {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader';
        loader.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
        document.body.appendChild(loader);
    }

    clearLoadingState() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.remove();
        }
    }

    renderOfflineIndicator() {
        let indicator = document.getElementById('offline-indicator');

        if (!this.isOnline) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'offline-indicator';
                indicator.className = 'offline-indicator';
                indicator.textContent = 'Offline Mode';
                document.body.appendChild(indicator);
            }
        } else if (indicator) {
            indicator.remove();
        }
    }

    showNotification(message, type = 'info') {
        // Implementation for showing in-app notifications
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        const notificationArea = document.getElementById('notification-area');
        notificationArea.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    renderHome(container) {
        container.innerHTML = `
            <h2>Welcome to the Lifestyle Tracker</h2>
            <p>Start tracking your lifestyle and achieving your goals!</p>
            <div>
                <a href="${this.baseUrl}/login" data-route="/login">Login</a>
                <a href="${this.baseUrl}/signup" data-route="/signup">Sign Up</a>
            </div>
        `;
    }

    renderLogin(container) {
        container.innerHTML = `
            <h2>Login</h2>
            <form id="login-form">
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        `;
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const password = formData.get('password');
            try {
                this.cryptoKey = await this.auth.login(password);
                this.state.user = { loggedIn: true };
                await this.db.getDecryptedData('settings', this.cryptoKey)
                    .then(settings => this.state.settings = settings);
                this.navigateTo('/dashboard');
            } catch (error) {
                this.showError('Login failed');
            }
        });
    }

    renderSignup(container) {
        container.innerHTML = `
            <h2>Sign Up</h2>
            <form id="signup-form">
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Sign Up</button>
            </form>
        `;
        const signupForm = document.getElementById('signup-form');
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(signupForm);
            const password = formData.get('password');
            try {
                this.cryptoKey = await this.auth.setupAccount(password);
                this.state.user = { loggedIn: true };
                this.state.settings = await this.db.getDecryptedData('settings', this.cryptoKey);
                this.navigateTo('/dashboard');
            } catch (error) {
                this.showError('Signup failed');
            }
        });
    }

    async renderDashboard(container) {
        if (!this.dashboardView) {
            this.dashboardView = new DashboardView(this);
        }
        await this.dashboardView.render(container);
    }

    async renderEntries(container) {
        if (!this.entriesView) {
            this.entriesView = new EntriesView(this);
        }
        await this.entriesView.render(container);
    }

    async renderGoals(container) {
        if (!this.goalsView) {
            this.goalsView = new GoalsView(this);
        }
        await this.goalsView.render(container);
    }

    renderSettings(container) {
        container.innerHTML = `
            <h2>Settings</h2>
            <p>Coming soon...</p>
        `;
        // Implement settings view logic here (to be implemented later)
    }

    render404(container) {
        container.innerHTML = `
            <h2>404 Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LifestyleTrackerApp();
    app.init();
});