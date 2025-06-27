class BarChart {
    constructor() {
        const ctx = document.getElementById('timeGraph').getContext('2d');
        this.originalValues = [];
        
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
                            text: 'Durée (jours ouvrés)' 
                        }
                    },
                    x: { 
                        title: { 
                            display: true, 
                            text: 'Étapes' 
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
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.parsed.y;
                                const originalValue = this.originalValues[context.dataIndex];
                                
                                // If original value was 0 and we're showing 0.5
                                if (originalValue === 0 && value === 0.5) {
                                    label += '<1 jour';
                                } else if (value === 1) {
                                    label += '1 jour';
                                } else {
                                    label += value + ' jours';
                                }
                                return label;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: true,
                    mode: 'point'
                }
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

        // Calculate and store original values
        this.originalValues = steps.map(step => {
            const values = durations
                .map(d => d[step])
                .filter(d => d !== null)
                .map(d => d.value);
            return this.calculateStat(values, statType);
        });

        const datasets = [{
            label: statType === 'average' ? 'Moyenne (jours ouvrés)' : 'Médiane (jours ouvrés)',
            data: this.originalValues.map((stat, index) => {
                // Display 0.5 instead of 0 for better visual representation
                // But not for Full Cycle Time and Dev Cycle Time
                if (stat === 0 && index < 7) { // First 7 are individual steps
                    return 0.5;
                }
                return stat;
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
