async function init() {
    const rawData = await fetchData();
    const barChart = new BarChart();
    const trendChart = new TrendChart();
    const prDistribution = new PRDistributionChart();
    const testerDistribution = new TesterDistributionChart();

    // Initialize filters
    const platformFilter = document.getElementById('platformFilter');
    const monthFilter = document.getElementById('monthFilter');

    // Get all months from all relevant date columns
    const months = [...new Set(
        rawData.slice(1).flatMap(row => {
            return Array.from({length: 7}, (_, i) => row[i + 3])
                .filter(date => date)
                .map(date => {
                    const parsedDate = new Date(date);
                    return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
                });
        })
    )].sort();

    // Populate month filter
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'long' });
        option.textContent = `${monthName} ${year}`;
        monthFilter.appendChild(option);
    });

    // Populate platform filter
    const platforms = [...new Set(rawData.slice(1).map(row => row[1]))];
    platforms.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        platformFilter.appendChild(option);
    });

    // Update function
    const updateCharts = () => {
        const selectedPlatform = platformFilter.value;
        const selectedMonth = monthFilter.value;
        
        // First filter by platform
        const platformFilteredRows = rawData.slice(1).filter(row => 
            selectedPlatform === 'all' || row[1] === selectedPlatform
        );

        // Calculate all durations
        const durations = calculateDurations(platformFilteredRows);
        
        // Then filter by selected month if needed
        const monthFilteredDurations = selectedMonth === 'all' 
            ? durations 
            : durations.filter(duration => {
                return Object.values(duration).some(metric => 
                    metric && metric.month === selectedMonth
                );
            });

        const statType = document.querySelector('input[name="statType"]:checked').value;

        // Update all charts
        barChart.update(monthFilteredDurations, statType);
        trendChart.update(monthFilteredDurations);
        prDistribution.update(monthFilteredDurations);
        testerDistribution.update(monthFilteredDurations);

        // Update Dev Cycle Time box
        const devCycleDurations = monthFilteredDurations
            .map(d => d['Dev Cycle Time'])
            .filter(d => d !== null)
            .map(d => d.value);

        document.getElementById('averageTime').textContent = barChart.calculateStat(devCycleDurations, 'average');
        document.getElementById('medianTime').textContent = barChart.calculateStat(devCycleDurations, 'median');
    };

    // Add event listeners
    platformFilter.addEventListener('change', updateCharts);
    monthFilter.addEventListener('change', updateCharts);
    document.querySelectorAll('input[name="statType"]').forEach(radio => {
        radio.addEventListener('change', updateCharts);
    });

    // Initial update
    updateCharts();
}

// Start the application
init();