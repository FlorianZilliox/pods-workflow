class DistributionChart {
    constructor(canvasId, title, labels) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#4BC0C0', // Vert
                        '#FFCE56', // Jaune
                        '#FF6384'  // Rouge
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} tickets (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

class PRDistributionChart extends DistributionChart {
    constructor() {
        super('prPieChart', 'PR Review Time', 
            ['24h or less', '24-72h', 'More than 72h']);
    }

    update(durations) {
        const prReviews = durations
            .map(d => d['Pull Request Time'])
            .filter(pr => pr !== null)
            .map(pr => pr.value);

        const distribution = {
            fast: prReviews.filter(time => time <= 1).length,
            medium: prReviews.filter(time => time > 1 && time <= 3).length,
            slow: prReviews.filter(time => time > 3).length
        };

        this.chart.data.datasets[0].data = [
            distribution.fast,
            distribution.medium,
            distribution.slow
        ];

        this.chart.update();
    }
}

class TesterDistributionChart extends DistributionChart {
    constructor() {
        super('testerPieChart', 'Tester Assignment Time', 
            ['24h or less', '24-72h', 'More than 72h']);
    }

    update(durations) {
        const testerAssignments = durations
            .map(d => d['Tester Assignment Time'])
            .filter(ta => ta !== null)
            .map(ta => ta.value);

        const distribution = {
            fast: testerAssignments.filter(time => time <= 1).length,
            medium: testerAssignments.filter(time => time > 1 && time <= 3).length,
            slow: testerAssignments.filter(time => time > 3).length
        };

        this.chart.data.datasets[0].data = [
            distribution.fast,
            distribution.medium,
            distribution.slow
        ];

        this.chart.update();
    }
}