// js/views/entries.js

class EntriesView {
    constructor(app) {
        this.app = app;
        this.db = app.db;
        this.cryptoKey = app.cryptoKey;
    }

    async render(container) {
        container.innerHTML = '';
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'entries-container';

        // Add new entry form
        entriesContainer.appendChild(this.createEntryForm());

        // Add entries list
        const entriesList = await this.createEntriesList();
        entriesContainer.appendChild(entriesList);

        container.appendChild(entriesContainer);
    }

    createEntryForm() {
        const form = document.createElement('form');
        form.className = 'entry-form';
        form.innerHTML = `
            <select name="category" required>
                <option value="water">Water</option>
                <option value="exercise">Exercise</option>
                <option value="nutrition">Nutrition</option>
                <option value="sleep">Sleep</option>
            </select>
            <input type="number" name="value" placeholder="Value" required>
            <input type="text" name="unit" placeholder="Unit (e.g., ml, minutes)" required>
            <textarea name="description" placeholder="Description"></textarea>
            <button type="submit">Add Entry</button>
            <button type="button" class="voice-btn">Use Voice</button>
        `;

        form.addEventListener('submit', this.handleNewEntry.bind(this));
        form.querySelector('.voice-btn').addEventListener('click', this.handleVoiceInput.bind(this));
        
        return form;
    }

    async createEntriesList() {
        const list = document.createElement('div');
        list.className = 'entries-list';

        const entries = await this.db.getAllEntries(this.cryptoKey);
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        entries.forEach(entry => {
            const entryElement = this.createEntryElement(entry);
            list.appendChild(entryElement);
        });

        return list;
    }

    createEntryElement(entry) {
        const element = document.createElement('div');
        element.className = 'entry-item';
        element.innerHTML = `
            <div class="entry-header">
                <span class="category">${entry.category}</span>
                <span class="timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
            </div>
            <div class="entry-content">
                <span class="value">${entry.value} ${entry.unit}</span>
                <p class="description">${entry.description}</p>
            </div>
        `;
        return element;
    }

    async handleNewEntry(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        try {
            const entry = {
                category: formData.get('category'),
                value: Number(formData.get('value')),
                unit: formData.get('unit'),
                description: formData.get('description'),
                timestamp: new Date().toISOString(),
                createdOffline: !navigator.onLine
            };

            await this.db.addEntry(entry, this.cryptoKey);
            this.app.showNotification('Entry added successfully');
            event.target.reset();
            
            // Refresh entries list
            const newList = await this.createEntriesList();
            const oldList = document.querySelector('.entries-list');
            oldList.replaceWith(newList);
        } catch (error) {
            this.app.showError('Failed to add entry');
        }
    }

    async handleVoiceInput() {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            const description = event.results[0][0].transcript;
            document.querySelector('[name="description"]').value = description;
        };
        
        recognition.start();
    }
}

export default EntriesView;