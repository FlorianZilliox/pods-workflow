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
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.parsed.y;
                                const originalValue = this.originalValues[context.dataIndex];
                                
                                // If original value was 0 and we're showing 0.5
                                if (originalValue === 0 && value === 0.5) {
                                    label += '<1 day';
                                } else if (value === 1) {
                                    label += '1 day';
                                } else {
                                    label += value + ' days';
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

    update(durations) {
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
        this.originalValues = steps.map((step, index) => {
            // Special handling for Dev Cycle Time - calculate as sum of steps
            if (step === 'Dev Cycle Time') {
                const stepsToSum = [
                    'Development Time',
                    'Pull Request Time',
                    'Design Review Time',
                    'Tester Assignment Time',
                    'Testing Time',
                    'PO Validation Time'
                ];
                
                const stepAverages = stepsToSum.map(s => {
                    const values = durations
                        .map(d => d[s])
                        .filter(d => d !== null)
                        .map(d => d.value);
                    const avg = this.calculateAverage(values);
                    // Treat 0 as 0.5 for consistency
                    return avg === 0 ? 0.5 : avg;
                });
                
                return Math.round(stepAverages.reduce((sum, val) => sum + val, 0));
            }
            
            // Special handling for Full Cycle Time - include Backlog Time
            if (step === 'Full Cycle Time') {
                const stepsToSum = [
                    'Backlog Time',
                    'Development Time',
                    'Pull Request Time',
                    'Design Review Time',
                    'Tester Assignment Time',
                    'Testing Time',
                    'PO Validation Time'
                ];
                
                const stepAverages = stepsToSum.map(s => {
                    const values = durations
                        .map(d => d[s])
                        .filter(d => d !== null)
                        .map(d => d.value);
                    const avg = this.calculateAverage(values);
                    // Treat 0 as 0.5 for consistency
                    return avg === 0 ? 0.5 : avg;
                });
                
                return Math.round(stepAverages.reduce((sum, val) => sum + val, 0));
            }
            
            // Normal calculation for other steps
            const values = durations
                .map(d => d[step])
                .filter(d => d !== null)
                .map(d => d.value);
            return this.calculateAverage(values);
        });

        const datasets = [{
            label: 'Average (business days)',
            data: this.originalValues.map((avg, index) => {
                // Display 0.5 instead of 0 for better visual representation
                // But not for Full Cycle Time and Dev Cycle Time
                if (avg === 0 && index < 7) { // First 7 are individual steps
                    return 0.5;
                }
                return avg;
            }),
            backgroundColor: 'rgba(74, 144, 226, 0.6)',
            borderColor: 'rgba(74, 144, 226, 1)',
            borderWidth: 1
        }];

        this.chart.data.labels = steps;
        this.chart.data.datasets = datasets;
        this.chart.update();
    }

    calculateAverage(data) {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc, val) => acc + val, 0);
        return roundToNearest(sum / data.length);
    }
}
