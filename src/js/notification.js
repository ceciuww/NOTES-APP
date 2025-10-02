// src/js/notification.js
class NotificationManager {
    constructor() {
        this.publicVapidKey = 'BP8vD7V3y5q4t6w9z$C&F)J@NcRfUjXn2r5u7x!A%D*G-KaPdSgVkYp3s6v9y$B&E';
        this.swRegistration = null;
    }

    // Initialize notification service
    async init() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported');
            return false;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully');

            // Request notification permission
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    // Subscribe to push notifications
    async subscribe() {
        if (!this.swRegistration) {
            const initialized = await this.init();
            if (!initialized) throw new Error('Notification service not initialized');
        }

        try {
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
            });

            // Save subscription to server (simulate with localStorage for demo)
            await this.saveSubscription(subscription);
            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            throw error;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribe() {
        if (!this.swRegistration) return;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                await this.deleteSubscription(subscription);
                return true;
            }
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
        }
        return false;
    }

    // Check if user is subscribed
    async isSubscribed() {
        if (!this.swRegistration) return false;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            return subscription !== null;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }

    // Toggle notifications
    async toggleNotifications() {
        try {
            const isSubscribed = await this.isSubscribed();
            
            if (isSubscribed) {
                await this.unsubscribe();
                return false;
            } else {
                await this.subscribe();
                return true;
            }
        } catch (error) {
            console.error('Error toggling notifications:', error);
            throw error;
        }
    }

    // Send test notification
    async sendTestNotification() {
        if (!await this.isSubscribed()) {
            throw new Error('User is not subscribed to notifications');
        }

        // This would typically be done by your server
        console.log('Test notification would be sent from server');
        
        // Simulate local notification for demo
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Story App Test', {
                body: 'This is a test notification from Story App!',
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/icon-96x96.png'
            });
        }
    }

    // Utility function to convert VAPID key
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Save subscription (simulate server call)
    async saveSubscription(subscription) {
        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
        console.log('Subscription saved:', subscription);
        
        // In a real app, you would send this to your server
        // await fetch('/api/save-subscription', {
        //     method: 'POST',
        //     body: JSON.stringify(subscription),
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // });
    }

    // Delete subscription (simulate server call)
    async deleteSubscription(subscription) {
        localStorage.removeItem('pushSubscription');
        console.log('Subscription deleted:', subscription);
        
        // In a real app, you would notify your server
        // await fetch('/api/delete-subscription', {
        //     method: 'POST',
        //     body: JSON.stringify(subscription),
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // });
    }
}

export { NotificationManager };
