// goal-tracker.js
import { Charts } from './charts.js';
import { DateUtils } from './date-utils.js';

export class GoalTracker {
    constructor(db, cryptoKey) {
        this.db = db;
        this.cryptoKey = cryptoKey;
    }

    async trackProgress(goalId, value) {
        const goals = await this.db.getDecryptedData('goals', this.cryptoKey);
        const goal = goals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Goal not found');
        }

        goal.current += value;
        
        // Update goal status
        if (goal.current >= goal.target) {
            goal.status = 'completed';
        } else if (new Date(goal.deadline) < new Date()) {
            goal.status = 'failed';
        }

        await this.db.saveEncryptedData('goals', goals, this.cryptoKey);
        return goal;
    }

    async getGoalProgress(goalId) {
        const goals = await this.db.getDecryptedData('goals', this.cryptoKey);
        const goal = goals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Goal not found');
        }

        return {
            progress: (goal.current / goal.target) * 100,
            remaining: goal.target - goal.current,
            daysLeft: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        };
    }

    renderProgressChart(container, goal) {
        return Charts.createProgressChart(container, {
            current: goal.current,
            target: goal.target
        });
    }

    async generateGoalInsights(goalId) {
        const goal = await this.getGoalProgress(goalId);
        const insights = [];

        if (goal.daysLeft < 7 && goal.progress < 80) {
            insights.push('Warning: Goal deadline approaching with significant progress remaining');
        }

        if (goal.progress >= 80) {
            insights.push('Almost there! Keep pushing to reach your goal');
        }

        if (goal.progress === 100) {
            insights.push('Congratulations! You\'ve achieved your goal');
        }

        return insights;
    }
}