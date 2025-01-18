// validation.js
export class Validation {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePassword(password) {
        return password.length >= 8;
    }

    static validateGoal(goal) {
        return {
            isValid: Boolean(
                goal.title &&
                goal.category &&
                goal.target > 0 &&
                goal.unit &&
                goal.deadline
            ),
            errors: {
                title: !goal.title ? 'Title is required' : null,
                category: !goal.category ? 'Category is required' : null,
                target: goal.target <= 0 ? 'Target must be greater than 0' : null,
                unit: !goal.unit ? 'Unit is required' : null,
                deadline: !goal.deadline ? 'Deadline is required' : null
            }
        };
    }

    static validateEntry(entry) {
        return {
            isValid: Boolean(
                entry.value &&
                entry.category &&
                entry.date
            ),
            errors: {
                value: !entry.value ? 'Value is required' : null,
                category: !entry.category ? 'Category is required' : null,
                date: !entry.date ? 'Date is required' : null
            }
        };
    }
}