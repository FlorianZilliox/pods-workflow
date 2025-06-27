class BarChart {
    constructor() {
        const ctx = document.getElementById('timeGraph').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'bar',
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
                            text: 'Steps' 
                        }, 
                        grid: {
                            offset: false
                        }
                    }
                },
                plugins: { 
                    legend: { 
                        labels: { 
                            font: { size: 14 } 
                        }
                    },
                    tooltip: {
                        enabled: true,
                        position: 'average',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 14 },
                        padding: 10,
                        displayColors: true,
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
                                if (value === 0) {
                                    label += '<1 business day';
                                } else {
                                    label += value.toFixed(1) + ' business days';
                                }
                                return label;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: true,
                    mode: 'point'
                },
                // Custom plugin to draw value labels on bars
                plugins: [{
                    afterDatasetsDraw: function(chart) {
                        const ctx = chart.ctx;
                        chart.data.datasets.forEach((dataset, i) => {
                            const meta = chart.getDatasetMeta(i);
                            meta.data.forEach((bar, index) => {
                                const value = dataset.data[index];
                                const displayValue = value === 0 ? '<1' : value.toString();
                                
                                ctx.fillStyle = '#666';
                                ctx.font = 'bold 12px Arial';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                
                                // Position the text above the bar
                                const x = bar.x;
                                const y = bar.y - 5;
                                
                                ctx.fillText(displayValue, x, y);
                            });
                        });
                    }
                }]
            }
        });
    }

    update(durations, statType) {
        const steps = [
            'Backlog Time',
            'Development Time',
            'Pull Request Time',
            'Design Review Time',
            'Tester Assignment Time',
            'Testing Time',
            'PO Validation Time',
            'Full Cycle Time',
            'Dev Cycle Time'
        ];

        const datasets = [{
            label: statType === 'average' ? 'Average (business days)' : 'Median (business days)',
            data: steps.map(step => {
                const values = durations
                    .map(d => d[step])
                    .filter(d => d !== null)
                    .map(d => d.value);
                return this.calculateStat(values, statType);
            }),
            backgroundColor: 'rgba(74, 144, 226, 0.6)',
            borderColor: 'rgba(74, 144, 226, 1)',
            borderWidth: 1
        }];

        this.chart.data.labels = steps;
        this.chart.data.datasets = datasets;
        this.chart.update();
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
}
