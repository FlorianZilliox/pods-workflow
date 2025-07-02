class TrendChart {
    constructor() {
        const ctx = document.getElementById('trendGraph').getContext('2d');
        
        this.workflowColors = {
            'Backlog Time': '#FF6384',
            'Development Time': '#36A2EB',
            'Pull Request Time': '#FFCE56',
            'Design Review Time': '#4BC0C0',
            'Tester Assignment Time': '#9966FF',
            'Testing Time': '#FF9F40',
            'PO Validation Time': '#7CBA3D'
        };

        this.cycleColors = {
            'Dev Cycle Time': '#4a90e2'
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

        // Current data stored for toggle
        this.currentDurations = [];
        this.currentStatType = 'average';
        
        // Add event listener for the toggle
        this.setupToggleListener();
    }

    setupToggleListener() {
        document.querySelectorAll('input[name="trendView"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.currentDurations.length > 0) {
                    this.updateChart();
                }
            });
        });
    }

    calculateStat(data, type) {
        if (data.length === 0) return 0;
        if (type === 'median') {
            const sorted = data.sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : roundToNearest((sorted[mid - 1] + sorted[mid]) / 2);
        }
        const sum = data.reduce((acc, val) => acc + val, 0);
        return roundToNearest(sum / data.length);
    }

    update(durations, statType) {
        // Store data for toggle
        this.currentDurations = durations;
        this.currentStatType = statType;
        
        // Update chart based on current view
        this.updateChart();
    }

    updateChart() {
        const viewMode = document.querySelector('input[name="trendView"]:checked').value;
        
        if (viewMode === 'steps') {
            this.showWorkflowSteps();
        } else {
            this.showDevCycle();
        }
    }

    showWorkflowSteps() {
        // Get all unique months from all metrics
        const allMonths = new Set();
        Object.keys(this.workflowColors).forEach(metric => {
            this.currentDurations.forEach(d => {
                if (d[metric] && d[metric].month) {
                    allMonths.add(d[metric].month);
                }
            });
        });
        const months = [...allMonths].sort();

        // Create datasets for each workflow step
        const datasets = Object.keys(this.workflowColors).map(metric => {
            const monthlyStats = months.map(month => {
                const monthData = this.currentDurations
                    .map(d => d[metric])
                    .filter(d => d !== null)
                    .filter(d => d.month === month)
                    .map(d => d.value);
                
                if (monthData.length === 0) return null;
                
                const stat = this.calculateStat(monthData, this.currentStatType);
                
                // Show 0.5 instead of 0 for better visual representation
                return stat === 0 ? 0.5 : stat;
            });

            return {
                label: metric,
                data: monthlyStats,
                borderColor: this.workflowColors[metric],
                backgroundColor: this.workflowColors[metric],
                tension: 0.4,
                fill: false,
                spanGaps: true
            };
        });

        // Update chart
        this.chart.options.scales.y.title.text = `Duration (business days) - ${this.currentStatType === 'median' ? 'Median' : 'Average'}`;
        this.chart.data.labels = months.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        });
        this.chart.data.datasets = datasets;
        this.chart.update();
    }

    showDevCycle() {
        // Get all unique months from Dev Cycle Time
        const allMonths = new Set();
        this.currentDurations.forEach(d => {
            if (d['Dev Cycle Time'] && d['Dev Cycle Time'].month) {
                allMonths.add(d['Dev Cycle Time'].month);
            }
        });
        const months = [...allMonths].sort();

        // Create dataset for Dev Cycle Time only
        const datasets = [{
            label: 'Dev Cycle Time',
            data: months.map(month => {
                const monthData = this.currentDurations
                    .map(d => d['Dev Cycle Time'])
                    .filter(d => d !== null)
                    .filter(d => d.month === month)
                    .map(d => d.value);
                
                if (monthData.length === 0) return null;
                
                return this.calculateStat(monthData, this.currentStatType);
            }),
            borderColor: this.cycleColors['Dev Cycle Time'],
            backgroundColor: this.cycleColors['Dev Cycle Time'],
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            spanGaps: true,
            pointRadius: 6,
            pointHoverRadius: 8
        }];

        // Update chart
        this.chart.options.scales.y.title.text = `Dev Cycle Time (business days) - ${this.currentStatType === 'median' ? 'Median' : 'Average'}`;
        this.chart.data.labels = months.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        });
        this.chart.data.datasets = datasets;
        this.chart.update();
    }
}
