// entry-form.js
export class EntryForm {
    constructor(categories, onSubmit) {
        this.categories = categories;
        this.onSubmit = onSubmit;
    }

    render() {
        const form = document.createElement('form');
        form.className = 'entry-form';
        
        form.innerHTML = `
            <select name="category" required>
                ${this.categories.map(category => 
                    `<option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>`
                ).join('')}
            </select>
            <input type="number" name="value" placeholder="Value" required>
            <input type="datetime-local" name="date" required>
            <textarea name="notes" placeholder="Notes (optional)"></textarea>
            <button type="submit">Add Entry</button>
        `;

        form.addEventListener('submit', this.handleSubmit.bind(this));
        return form;
    }

    handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const entry = {
            category: formData.get('category'),
            value: Number(formData.get('value')),
            date: new Date(formData.get('date')).toISOString(),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };

        this.onSubmit(entry);
        event.target.reset();
    }
}