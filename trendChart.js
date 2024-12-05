class TrendChart {
    constructor() {
        const ctx = document.getElementById('trendGraph').getContext('2d');
        
        this.colors = {
            'Backlog Time': '#FF6384',
            'Development Time': '#36A2EB',
            'Pull Request Time': '#FFCE56',
            'Design Review Time': '#4BC0C0',
            'Tester Assignment Time': '#9966FF',
            'Testing Time': '#FF9F40',
            'PO Validation Time': '#7CBA3D'
        };

        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Duration (business days)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.y.toFixed(1) + ' business days';
                                return label;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    // Helper function to get all months between first and last date
    getAllMonthsBetween(firstDate, lastDate) {
        const months = [];
        let currentDate = new Date(firstDate);
        const endDate = new Date(lastDate);
        
        while (currentDate <= endDate) {
            months.push(currentDate.toISOString().slice(0, 7));
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return months;
    }

    update(durations) {
        // Find first and last dates in all metrics
        let firstDate = null;
        let lastDate = null;
        
        Object.keys(this.colors).forEach(metric => {
            durations.forEach(d => {
                if (d[metric] && d[metric].month) {
                    const currentDate = new Date(d[metric].month + "-01");
                    if (!firstDate || currentDate < firstDate) firstDate = currentDate;
                    if (!lastDate || currentDate > lastDate) lastDate = currentDate;
                }
            });
        });

        // Get all months between first and last date
        const months = firstDate && lastDate ? this.getAllMonthsBetween(firstDate, lastDate) : [];

        // Create datasets for each metric
        const datasets = Object.keys(this.colors).map(metric => {
            const monthlyAverages = months.map(month => {
                const monthData = durations
                    .filter(d => d[metric] && d[metric].month === month)
                    .map(d => d[metric].value);
                
                if (monthData.length === 0) return null;
                const sum = monthData.reduce((acc, val) => acc + val, 0);
                return roundToNearest(sum / monthData.length);
            });

            return {
                label: metric,
                data: monthlyAverages,
                borderColor: this.colors[metric],
                backgroundColor: this.colors[metric],
                tension: 0.4,
                fill: false,
                spanGaps: true  // Pour connecter les points même avec des données manquantes
            };
        });

        this.chart.data.labels = months.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        });
        this.chart.data.datasets = datasets;
        this.chart.update();
    }
}