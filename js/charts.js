// charts.js
export class Charts {
    static createProgressChart(container, data, options = {}) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const { width = 300, height = 200, color = '#4CAF50' } = options;
        
        canvas.width = width;
        canvas.height = height;
        
        // Calculate progress percentage
        const progress = (data.current / data.target) * 100;
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 3, 0, 2 * Math.PI);
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 10;
        ctx.stroke();
        
        // Draw progress arc
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 3, 
                -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * progress / 100));
        ctx.strokeStyle = color;
        ctx.stroke();
        
        // Add text
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(progress)}%`, width / 2, height / 2);
        
        container.appendChild(canvas);
        return canvas;
    }

    static createBarChart(container, data, options = {}) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const { width = 600, height = 400, color = '#2196F3' } = options;
        
        canvas.width = width;
        canvas.height = height;
        
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        // Find max value for scaling
        const maxValue = Math.max(...data.values);
        
        // Draw bars
        const barWidth = chartWidth / data.values.length;
        data.values.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            ctx.fillStyle = color;
            ctx.fillRect(
                padding + (index * barWidth),
                height - padding - barHeight,
                barWidth - 5,
                barHeight
            );
            
            // Add labels
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                data.labels[index],
                padding + (index * barWidth) + (barWidth / 2),
                height - padding + 15
            );
        });
        
        container.appendChild(canvas);
        return canvas;
    }
}