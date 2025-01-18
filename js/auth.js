// auth.js
export class Auth {
    constructor(database) {
        this.db = database;
    }

    async setupAccount(password) {
        const salt = await CryptoUtils.generateSalt();
        const cryptoKey = await CryptoUtils.deriveKey(password, salt);
        
        // Store salt and initial settings
        await this.db.saveEncryptedData('user', { 
            salt,
            created: new Date().toISOString()
        }, cryptoKey);

        // Initialize default settings
        await this.db.saveEncryptedData('settings', {
            theme: 'light',
            notifications: true,
            categories: [
                'water',
                'exercise',
                'nutrition',
                'sleep',
                'mindfulness'
            ],
            dashboardLayout: ['goals', 'quickAdd', 'todayProgress'],
            notificationSettings: {
                morning: true,
                morningTime: '08:00',
                reminders: true,
                insights: true
            }
        }, cryptoKey);

        return cryptoKey;
    }

    async login(password) {
        try {
            // First retrieve the salt
            const userData = await this.db.getDecryptedData('user', 
                await CryptoUtils.deriveKey(password, 'dummy-salt'));
            
            if (!userData || !userData.salt) {
                throw new Error('Invalid password');
            }

            // Now derive the actual key using the correct salt
            const cryptoKey = await CryptoUtils.deriveKey(password, userData.salt);

            // Verify by trying to decrypt settings
            await this.db.getDecryptedData('settings', cryptoKey);

            return cryptoKey;
        } catch (error) {
            throw new Error('Login failed');
        }
    }

    async changePassword(oldPassword, newPassword) {
        const oldKey = await this.login(oldPassword);
        const newKey = await CryptoUtils.deriveKey(newPassword, 
            await CryptoUtils.generateSalt());

        // Re-encrypt all data with new key
        const stores = ['user', 'settings'];
        for (const store of stores) {
            const data = await this.db.getDecryptedData(store, oldKey);
            await this.db.saveEncryptedData(store, data, newKey);
        }

        return newKey;
    }
}