// calendar.js
import { DateUtils } from './date-utils.js';

export class Calendar {
    constructor(container, onDateSelect) {
        this.container = container;
        this.onDateSelect = onDateSelect;
        this.currentDate = new Date();
    }

    render() {
        const calendar = document.createElement('div');
        calendar.className = 'calendar';
        
        calendar.innerHTML = `
            <div class="calendar-header">
                <button class="prev-month">&lt;</button>
                <h3>${this.currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h3>
                <button class="next-month">&gt;</button>
            </div>
            <div class="calendar-grid">
                ${this.renderDays()}
                ${this.renderDates()}
            </div>
        `;

        this.attachEventListeners(calendar);
        return calendar;
    }

    renderDays() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(day => `<div class="calendar-day">${day}</div>`).join('');
    }

    renderDates() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        
        let dates = '';
        
        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDay; i++) {
            dates += '<div class="calendar-date empty"></div>';
        }
        
        // Add the dates
        for (let i = 1; i <= daysInMonth; i++) {
            dates += `<div class="calendar-date" data-date="${year}-${month + 1}-${i}">${i}</div>`;
        }
        
        return dates;
    }

    attachEventListeners(calendar) {
        calendar.querySelector('.prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.container.replaceChild(this.render(), calendar);
        });

        calendar.querySelector('.next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.container.replaceChild(this.render(), calendar);
        });

        calendar.querySelectorAll('.calendar-date:not(.empty)').forEach(date => {
            date.addEventListener('click', () => {
                if (this.onDateSelect) {
                    this.onDateSelect(new Date(date.dataset.date));
                }
            });
        });
    }
}