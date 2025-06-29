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
                            text: 'Duration (business days) - Average'
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
                                const value = context.parsed.y;
                                
                                // Check if this is showing 0.5 which was originally 0
                                if (value === 0.5) {
                                    label += '<1 day';
                                } else if (value === 1) {
                                    label += '1 day';
                                } else {
                                    label += value.toFixed(1) + ' days';
                                }
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

    calculateAverage(data) {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc, val) => acc + val, 0);
        return roundToNearest(sum / data.length);
    }

    update(durations) {
        // Get all unique months from all metrics
        const allMonths = new Set();
        Object.keys(this.colors).forEach(metric => {
            durations.forEach(d => {
                if (d[metric] && d[metric].month) {
                    allMonths.add(d[metric].month);
                }
            });
        });
        const months = [...allMonths].sort();

        // Create datasets for each metric
        const datasets = Object.keys(this.colors).map(metric => {
            const monthlyAverages = months.map(month => {
                const monthData = durations
                    .map(d => d[metric])
                    .filter(d => d !== null)
                    .filter(d => d.month === month)
                    .map(d => d.value);
                
                if (monthData.length === 0) return null;
                
                // Calculate average
                const avg = this.calculateAverage(monthData);
                
                // Show 0.5 instead of 0 for better visual representation
                return avg === 0 ? 0.5 : avg;
            });

            return {
                label: metric,
                data: monthlyAverages,
                borderColor: this.colors[metric],
                backgroundColor: this.colors[metric],
                tension: 0.4,
                fill: false,
                spanGaps: true
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
