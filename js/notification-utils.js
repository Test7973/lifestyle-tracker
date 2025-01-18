// notification-utils.js
export class NotificationUtils {
    constructor() {
        this.permission = Notification.permission;
    }

    static async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    static async showNotification(title, options = {}) {
        if (Notification.permission !== 'granted') {
            return false;
        }

        try {
            const notification = new Notification(title, {
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/icon-192x192.png',
                ...options
            });

            notification.onclick = function(event) {
                event.preventDefault();
                window.focus();
                notification.close();
            };

            return true;
        } catch (error) {
            console.error('Error showing notification:', error);
            return false;
        }
    }

    static scheduleNotification(title, options = {}, delay) {
        setTimeout(() => {
            this.showNotification(title, options);
        }, delay);
    }
}