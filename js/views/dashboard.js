
class DashboardView {
    constructor(app) {
        this.app = app;
        this.db = app.db;
        this.cryptoKey = app.cryptoKey;
        
        // Bind methods
        this.render = this.render.bind(this);
        this.handleQuickAdd = this.handleQuickAdd.bind(this);
        this.handleVoiceInput = this.handleVoiceInput.bind(this);
    }

    async render(container) {
        this.container = container;
        container.innerHTML = ''; // Clear container

        try {
            // Load necessary data
            const [todayEntries, goals, settings] = await Promise.all([
                this.loadTodayEntries(),
                this.loadActiveGoals(),
                this.loadSettings()
            ]);
            
            // Create dashboard sections
            const dashboard = document.createElement('div');
            dashboard.className = 'dashboard';

            // Add quick action buttons
            dashboard.appendChild(this.createQuickActions(settings));

            // Add today's summary
            dashboard.appendChild(this.createTodaySummary(todayEntries));

            // Add goals progress section
            dashboard.appendChild(this.createGoalsProgress(goals));

            // Add offline data status
            dashboard.appendChild(this.createOfflineStatus());

            container.appendChild(dashboard);

            // Initialize any necessary event listeners
            this.initializeEventListeners();

        } catch (error) {
            console.error('Error rendering dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    createQuickActions(settings) {
        const section = document.createElement('section');
        section.className = 'quick-actions';

        // Voice input button (with offline check)
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'voice-input-btn';
        voiceBtn.innerHTML = '<i class="mic-icon"></i> Voice Input';
        voiceBtn.addEventListener('click', this.handleVoiceInput);
        
        // Only enable voice button if the feature is available
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn.disabled = true;
            voiceBtn.title = 'Voice input not available offline';
        }

        // Quick add buttons based on settings
        const quickAddContainer = document.createElement('div');
        quickAddContainer.className = 'quick-add-container';
        
        settings.quickAddPresets?.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'quick-add-btn';
            btn.textContent = preset.name;
            btn.addEventListener('click', () => this.handleQuickAdd(preset));
            quickAddContainer.appendChild(btn);
        });

        section.appendChild(voiceBtn);
        section.appendChild(quickAddContainer);
        return section;
    }

    createTodaySummary(entries) {
        const section = document.createElement('section');
        section.className = 'today-summary';

        // Group entries by category
        const categorized = entries.reduce((acc, entry) => {
            if (!acc[entry.category]) acc[entry.category] = [];
            acc[entry.category].push(entry);
            return acc;
        }, {});
        
        // Create summary cards for each category
        Object.entries(categorized).forEach(([category, categoryEntries]) => {
            const card = document.createElement('div');
            card.className = 'summary-card';
            
            const total = categoryEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
            
            card.innerHTML = `
                <h3>${category}</h3>
                <p class="total">${total} ${categoryEntries[0]?.unit || ''}</p>
                <div class="entries-list">
                    ${categoryEntries.map(entry => `
                        <div class="entry-item">
                            <span>${entry.description}</span>
                            <span>${entry.value} ${entry.unit || ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            section.appendChild(card);
        });

        return section;
    }

    createGoalsProgress(goals) {
        const section = document.createElement('section');
        section.className = 'goals-progress';

        goals.forEach(goal => {
            const progressCard = document.createElement('div');
            progressCard.className = 'progress-card';
            
            const percentage = (goal.current / goal.target) * 100;
            
            progressCard.innerHTML = `
                <h3>${goal.title}</h3>
                <div class="progress-bar">
                    <div class="progress" style="width: ${percentage}%"></div>
                </div>
                <p>${goal.current} / ${goal.target} ${goal.unit}</p>
            `;
            
            section.appendChild(progressCard);
        });

        return section;
    }

    createOfflineStatus() {
        const section = document.createElement('div');
        section.className = 'offline-status';

        if (!navigator.onLine) {
            const lastSync = localStorage.getItem('lastSync') || 'never';
            section.innerHTML = `
                <p>You're currently offline. Last sync: ${lastSync}</p>
                <p>All changes will be saved locally</p>
            `;
        }

        return section;
    }

    async handleQuickAdd(preset) {
        try {
            const entry = {
                category: preset.category,
                value: preset.value,
                unit: preset.unit,
                description: preset.description,
                date: new Date().toISOString(),
                createdOffline: !navigator.onLine
            };
            
            await this.db.addEntry(entry, this.cryptoKey);
            
            // Refresh the today's summary section
            const todayEntries = await this.loadTodayEntries();
            const summarySection = this.container.querySelector('.today-summary');
            summarySection.replaceWith(this.createTodaySummary(todayEntries));

            this.app.showNotification(`Added ${preset.description}`);
        } catch (error) {
            console.error('Error adding quick entry:', error);
            this.app.showError('Failed to add entry');
        }
    }

    async handleVoiceInput() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Voice input not supported');
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';

            recognition.onresult = async (event) => {
                const text = event.results[0][0].transcript;
                // Process voice input and create entry
                await this.processVoiceInput(text);
            };

            recognition.onerror = (event) => {
                console.error('Voice input error:', event.error);
                this.app.showError('Voice input failed');
            };

            recognition.start();
        } catch (error) {
            console.error('Voice input error:', error);
            this.app.showError('Voice input not available');
        }
    }

    async processVoiceInput(text) {
        // Simple natural language processing for voice input
        // Example: "Add 2 glasses of water" or "Log 30 minutes of exercise"
        try {
            const patterns = {
                water: /(\d+)\s*(glass|glasses|ml|liter|liters)\s*(of)?\s*water/i,
                exercise: /(\d+)\s*(minutes|minute|hour|hours)\s*(of)?\s*(exercise|workout|running|cycling)/i,
                // Add more patterns as needed
            };

            let entry = null;

            for (const [category, pattern] of Object.entries(patterns)) {
                const match = text.match(pattern);
                if (match) {
                    entry = {
                        category,
                        value: parseInt(match[1]),
                        unit: match[2],
                        description: text,
                        date: new Date().toISOString(),
                        createdOffline: !navigator.onLine
                    };
                    break;
                }
            }

            if (entry) {
                await this.db.addEntry(entry, this.cryptoKey);
                this.app.showNotification('Entry added from voice input');
                
                // Refresh today's summary
                const todayEntries = await this.loadTodayEntries();
                const summarySection = this.container.querySelector('.today-summary');
                summarySection.replaceWith(this.createTodaySummary(todayEntries));
            } else {
                this.app.showNotification('Could not understand voice input', 'warning');
            }
        } catch (error) {
            console.error('Error processing voice input:', error);
            this.app.showError('Failed to process voice input');
        }
    }

    async loadTodayEntries() {
        const today = new Date().toISOString().split('T')[0];
        return await this.db.getEntriesByDate(today, this.cryptoKey);
    }

    async loadActiveGoals() {
        const goals = await this.db.getDecryptedData('goals', this.cryptoKey);
        return goals.filter(g => g.status == 'active');
    }

    async loadSettings() {
        return await this.db.getDecryptedData('settings', this.cryptoKey);
    }

    initializeEventListeners() {
        // Add any necessary event listeners for dashboard interactivity
        window.addEventListener('online', () => {
            const offlineStatus = this.container.querySelector('.offline-status');
            if (offlineStatus) {
                offlineStatus.remove();
            }
        });

        window.addEventListener('offline', () => {
            const offlineStatus = this.createOfflineStatus();
            this.container.appendChild(offlineStatus);
        });
    }
}

export default DashboardView;
