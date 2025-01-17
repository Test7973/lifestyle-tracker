// js/views/settings.js

class SettingsView {
    constructor(app) {
        this.app = app;
        this.db = app.db;
        this.cryptoKey = app.cryptoKey;
        this.container = null; // To keep track of the main container
    }

    async render(container) {
        this.container = container;
        container.innerHTML = '';
        const settings = await this.db.getDecryptedData('settings', this.cryptoKey);

        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'settings-container';

        settingsContainer.innerHTML = `
            <h2>Settings</h2>
            
            <section class="theme-settings">
                <h3>Theme</h3>
                <select id="theme" name="theme">
                    <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                    <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                </select>
            </section>

            <section class="notification-settings">
                <h3>Notifications</h3>
                <label>
                    <input type="checkbox" name="notifications" 
                        ${settings.notifications ? 'checked' : ''}>
                    Enable Notifications
                </label>
                <label>
                    <input type="checkbox" name="morningReminder" 
                        ${settings.notificationSettings?.morning ? 'checked' : ''}>
                    Morning Reminders
                </label>
                <input type="time" name="morningTime" 
                    value="${settings.notificationSettings?.morningTime || '08:00'}">
            </section>

            <section class="quick-add-settings">
                <h3>Quick Add Presets</h3>
                <div id="presets-container">
                    ${settings.quickAddPresets?.map(preset => `
                        <div class="preset-item">
                            <input type="text" value="${preset.name}" readonly>
                            <button class="delete-preset" data-id="${preset.id}">Delete</button>
                        </div>
                    `).join('') || ''}
                </div>
                <button id="add-preset">Add New Preset</button>
            </section>

            <section class="data-settings">
                <h3>Data Management</h3>
                <button id="export-data">Export Data</button>
                <button id="import-data">Import Data</button>
                <button id="clear-data" class="danger">Clear All Data</button>
            </section>

            <section class="security-settings">
                <h3>Security</h3>
                <button id="change-password">Change Password</button>
            </section>
        `;

        this.attachEventListeners(settingsContainer);
        container.appendChild(settingsContainer);
    }

    attachEventListeners(container) {
        // Theme change
        container.querySelector('#theme').addEventListener('change', this.handleThemeChange.bind(this));

        // Notification settings
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', this.handleNotificationChange.bind(this));
        });

        // Quick add presets
        container.querySelector('#add-preset').addEventListener('click', this.handleAddPreset.bind(this));
        container.querySelectorAll('.delete-preset').forEach(button => {
            button.addEventListener('click', this.handleDeletePreset.bind(this));
        });

        // Data management
        container.querySelector('#export-data').addEventListener('click', this.handleExportData.bind(this));
        container.querySelector('#import-data').addEventListener('click', this.handleImportData.bind(this));
        container.querySelector('#clear-data').addEventListener('click', this.handleClearData.bind(this));

        // Security
        container.querySelector('#change-password').addEventListener('click', this.handleChangePassword.bind(this));
    }

    async handleThemeChange(event) {
        const theme = event.target.value;
        const settings = await this.db.getDecryptedData('settings', this.cryptoKey);
        settings.theme = theme;
        await this.db.saveEncryptedData('settings', settings, this.cryptoKey);
        document.body.className = theme;
        this.app.showNotification('Theme updated');
    }

    async handleNotificationChange(event) {
        const settings = await this.db.getDecryptedData('settings', this.cryptoKey);
        const name = event.target.name;
        
        if (name === 'notifications') {
            settings.notifications = event.target.checked;
            if (event.target.checked) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    event.target.checked = false;
                    settings.notifications = false;
                    this.app.showNotification('Notification permission denied', 'error');
                    return;
                }
            }
        } else {
            settings.notificationSettings = settings.notificationSettings || {};
            settings.notificationSettings[name] = event.target.checked;
        }

        await this.db.saveEncryptedData('settings', settings, this.cryptoKey);
        this.app.showNotification('Notification settings updated');
    }

    async handleAddPreset() {
        const settings = await this.db.getDecryptedData('settings', this.cryptoKey);
    
        // Create a new preset item (this could be a modal or a dedicated form)
        const newPreset = {
            id: Date.now().toString(), // Simple unique ID
            name: 'New Preset', // Default name
            category: 'water', // Example category
            value: 1, // Example value
            unit: 'glass' // Example unit
        };
    
        // Update the settings with the new preset
        settings.quickAddPresets = settings.quickAddPresets || [];
        settings.quickAddPresets.push(newPreset);
    
        // Save the updated settings
        await this.db.saveEncryptedData('settings', settings, this.cryptoKey);
    
        // Re-render the settings view to show the new preset
        this.render(this.container);
    }
    

    async handleDeletePreset(event) {
        const presetId = event.target.dataset.id;
        const settings = await this.db.getDecryptedData('settings', this.cryptoKey);
        settings.quickAddPresets = settings.quickAddPresets.filter(p => p.id !== presetId);
        await this.db.saveEncryptedData('settings', settings, this.cryptoKey);
        this.render(this.container);
    }

    async handleExportData() {
        try {
            const data = await this.db.exportData(this.cryptoKey);
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lifestyle-tracker-backup-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            this.app.showError('Failed to export data');
        }
    }

    handleImportData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (event) => {
            try {
                const file = event.target.files[0];
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const data = JSON.parse(e.target.result);
                    await this.db.importData(data, this.cryptoKey);
                    this.app.showNotification('Data imported successfully');
                };
                reader.readAsText(file);
            } catch (error) {
                this.app.showError('Failed to import data');
            }
        };
        input.click();
    }

    async handleClearData() {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            return;
        }
        try {
            await this.db.clearAllData(this.cryptoKey);
            this.app.showNotification('All data cleared');
        } catch (error) {
            this.app.showError('Failed to clear data');
        }
    }

    async handleChangePassword() {
        // Open a modal or navigate to a new view to change the password
        this.app.showNotification('Change password functionality coming soon');
    }
}

export default SettingsView;