// js/views/goals.js
export class GoalsView {
    constructor(app) {
        this.app = app;
        this.db = app.db;
        this.cryptoKey = app.cryptoKey;
    }

    async render(container) {
        container.innerHTML = '';
        const goalsContainer = document.createElement('div');
        goalsContainer.className = 'goals-container';
        
        // Add new goal form
        goalsContainer.appendChild(this.createGoalForm());
        
        // Add goals list
        const goalsList = await this.createGoalsList();
        goalsContainer.appendChild(goalsList);
        container.appendChild(goalsContainer);
    }

    createGoalForm() {
        const form = document.createElement('form');
        form.className = 'goal-form';
        form.innerHTML = `
            <input type="text" name="title" placeholder="Goal Title" required>
            <select name="category" required>
                <option value="water">Water</option>
                <option value="exercise">Exercise</option>
                <option value="nutrition">Nutrition</option>
                <option value="sleep">Sleep</option>
            </select>
            <input type="number" name="target" placeholder="Target Value" required>
            <input type="text" name="unit" placeholder="Unit (e.g., ml, minutes)" required>
            <input type="date" name="deadline" required>
            <button type="submit">Add Goal</button>
        `;
        form.addEventListener('submit', this.handleNewGoal.bind(this));
        return form;
    }

    async createGoalsList() {
        const list = document.createElement('div');
        list.className = 'goals-list';
        const goals = await this.db.getDecryptedData('goals', this.cryptoKey); // Updated to use the correct DB method
        goals.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        goals.forEach(goal => {
            const goalElement = this.createGoalElement(goal);
            list.appendChild(goalElement);
        });
        return list;
    }

    createGoalElement(goal) {
        const element = document.createElement('div');
        element.className = 'goal-item';
        const progress = (goal.current / goal.target) * 100;
       
        element.innerHTML = `
            <div class="goal-header">
                <h3>${goal.title}</h3>
                <span class="deadline">Due: ${new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${goal.current} / ${goal.target} ${goal.unit}</span>
            </div>
            <div class="goal-status">${goal.status}</div>
        `;
        return element;
    }

    async handleNewGoal(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
       
        try {
            const goal = {
                title: formData.get('title'),
                category: formData.get('category'),
                target: Number(formData.get('target')),
                current: 0,
                unit: formData.get('unit'),
                deadline: formData.get('deadline'),
                status: 'active',
                createdAt: new Date().toISOString(),
                createdOffline: !navigator.onLine
            };
            
            await this.db.saveEncryptedData('goals', goal, this.cryptoKey); // Updated to use the correct DB method
            this.app.showNotification('Goal added successfully');
            event.target.reset();
           
            // Refresh goals list
            const newList = await this.createGoalsList();
            const oldList = document.querySelector('.goals-list');
            oldList.replaceWith(newList);
        } catch (error) {
            this.app.showError('Failed to add goal');
        }
    }
}