// date-utils.js
export class DateUtils {
    static formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    static formatTime(date) {
        return new Date(date).toLocaleTimeString();
    }

    static formatDateTime(date) {
        return new Date(date).toLocaleString();
    }

    static getStartOfDay(date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    static getEndOfDay(date) {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return end;
    }

    static getWeekStart(date) {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        return start;
    }

    static getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
}