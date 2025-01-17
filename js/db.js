export class Database {
    constructor() {
        this.dbName = 'lifestyleTracker';
        this.version = 1;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // User store
                if (!db.objectStoreNames.contains('user')) {
                    db.createObjectStore('user', { keyPath: 'id' });
                }

                // Entries store with indexes
                if (!db.objectStoreNames.contains('entries')) {
                    const entriesStore = db.createObjectStore('entries', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    entriesStore.createIndex('date', 'date');
                    entriesStore.createIndex('category', 'category');
                    entriesStore.createIndex('date_category', ['date', 'category']);
                }

                // Goals store
                if (!db.objectStoreNames.contains('goals')) {
                    const goalsStore = db.createObjectStore('goals', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    goalsStore.createIndex('category', 'category');
                    goalsStore.createIndex('status', 'status');
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }
            };
        });
    }

    async saveEncryptedData(storeName, data, cryptoKey) {
        const encrypted = await CryptoUtils.encryptData(data, cryptoKey);
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ id: storeName, ...encrypted });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDecryptedData(storeName, cryptoKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName]);
            const store = transaction.objectStore(storeName);
            const request = store.get(storeName);

            request.onsuccess = async () => {
                if (request.result) {
                    const { encrypted, iv } = request.result;
                    const decrypted = await CryptoUtils.decryptData(encrypted, cryptoKey, iv);
                    resolve(decrypted);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Entry operations
    async addEntry(entry, cryptoKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');
            const request = store.add(entry);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getEntriesByDate(date, cryptoKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries']);
            const store = transaction.objectStore('entries');
            const index = store.index('date');
            const request = index.getAll(date);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Goal operations
    async addGoal(goal, cryptoKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['goals'], 'readwrite');
            const store = transaction.objectStore('goals');
            const request = store.add(goal);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateGoalProgress(goalId, progress, cryptoKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['goals'], 'readwrite');
            const store = transaction.objectStore('goals');
            const request = store.get(goalId);

            request.onsuccess = () => {
                const goal = request.result;
                goal.progress = progress;
                if (progress >= goal.target) {
                    goal.status = 'completed';
                }
                const updateRequest = store.put(goal);
                updateRequest.onsuccess = () => resolve(updateRequest.result);
            };
            request.onerror = () => reject(request.error);
        });
    }
    async getAllEntries(cryptoKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries']);
            const store = transaction.objectStore('entries');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async getGoalsByStatus(status, cryptoKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['goals']);
            const store = transaction.objectStore('goals');
            const index = store.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async exportData(cryptoKey) {
        const exportObject = {};
        const storeNames = ['user', 'entries', 'goals', 'settings']; // All store names

        return new Promise(async (resolve, reject) => {
            try {
                for (const storeName of storeNames) {
                    const transaction = this.db.transaction([storeName]);
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();

                    await new Promise((innerResolve, innerReject) => {
                        request.onsuccess = async () => {
                            if (storeName === 'user' || storeName === 'settings') {
                                // Decrypt data if needed
                                if (request.result) {
                                    const { encrypted, iv } = request.result[0]; // Assuming user and settings have only one entry
                                    const decrypted = await CryptoUtils.decryptData(encrypted, cryptoKey, iv);
                                    exportObject[storeName] = [decrypted]; // Storing as an array for consistency
                                } else {
                                    exportObject[storeName] = [];
                                }
                            } else {
                                exportObject[storeName] = request.result; // Store entries and goals as they are
                            }
                            innerResolve();
                        };

                        request.onerror = () => {
                            innerReject(request.error);
                        };
                    });
                }
                resolve(exportObject);
            } catch (error) {
                reject(error);
            }
        });
    }



    async importData(data, cryptoKey) {
        const storeNames = Object.keys(data);

        return new Promise(async (resolve, reject) => {
            try {
                for (const storeName of storeNames) {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);

                    if (storeName === 'user' || storeName === 'settings') {
                        // Encrypt data before storing
                        const encrypted = await CryptoUtils.encryptData(data[storeName][0], cryptoKey); // Assuming single entry
                        store.put({ id: storeName, ...encrypted });
                    } else {
                        // Clear existing data and add new data
                        store.clear();
                        for (const item of data[storeName]) {
                            store.add(item);
                        }
                    }
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    async clearAllData(cryptoKey) {
        const storeNames = ['user', 'entries', 'goals', 'settings']; // All store names

        return new Promise(async (resolve, reject) => {
            try {
                for (const storeName of storeNames) {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    store.clear(); // Clear all data in the store
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
    
}
class CryptoUtils {
    static async encryptData(data, cryptoKey) {
        // Implementation of encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            encoded
        );
        
        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    }

    static async decryptData(encryptedData, cryptoKey, iv) {
        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: new Uint8Array(iv) },
                cryptoKey,
                new Uint8Array(encryptedData)
            );
            
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            throw error;
        }
    }
}