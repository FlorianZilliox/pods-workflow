async function init() {
    let rawData = [];
    const barChart = new BarChart();
    const trendChart = new TrendChart();
    const prDistribution = new PRDistributionChart();
    const testerDistribution = new TesterDistributionChart();

    // Initialize filter elements
    const platformFilter = document.getElementById('platformFilter');
    const podFilter = document.getElementById('podFilter');
    const monthFilter = document.getElementById('monthFilter');

    // Function to load data and populate filters
    const loadDataAndFilters = async (year) => {
        // Fetch data for the selected year
        rawData = await fetchData(year);

        // Clear existing filter options (except "All")
        platformFilter.innerHTML = '<option value="all">All</option>';
        podFilter.innerHTML = '<option value="all">All</option>';
        monthFilter.innerHTML = '<option value="all">All</option>';

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
        const platforms = [...new Set(rawData.slice(1).map(row => row[1]))].filter(p => p);
        platforms.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            platformFilter.appendChild(option);
        });

        // Populate pod filter
        const pods = [...new Set(rawData.slice(1).map(row => row[10]))].filter(pod => pod);
        pods.forEach(pod => {
            const option = document.createElement('option');
            option.value = pod;
            option.textContent = pod;
            podFilter.appendChild(option);
        });
    };

    // Update function
    const updateCharts = () => {
        const selectedPlatform = platformFilter.value;
        const selectedPod = podFilter.value;
        const selectedMonth = monthFilter.value;
        
        // First filter by platform
        let filteredRows = rawData.slice(1).filter(row => 
            selectedPlatform === 'all' || row[1] === selectedPlatform
        );

        // Then filter by pod
        filteredRows = filteredRows.filter(row => 
            selectedPod === 'all' || row[10] === selectedPod
        );

        // Calculate all durations
        const durations = calculateDurations(filteredRows);
        
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
        trendChart.update(monthFilteredDurations, statType);
        prDistribution.update(monthFilteredDurations);
        testerDistribution.update(monthFilteredDurations);

        // Update Dev Cycle Time box - Calculate as sum of steps
        const stepsToSum = [
            'Development Time',
            'Pull Request Time', 
            'Design Review Time',
            'Tester Assignment Time',
            'Testing Time',
            'PO Validation Time'
        ];

        // Calculate sum of averages
        const stepAverages = stepsToSum.map(step => {
            const values = monthFilteredDurations
                .map(d => d[step])
                .filter(d => d !== null)
                .map(d => d.value);
            return barChart.calculateStat(values, 'average');
        });
        
        // Calculate sum of medians
        const stepMedians = stepsToSum.map(step => {
            const values = monthFilteredDurations
                .map(d => d[step])
                .filter(d => d !== null)
                .map(d => d.value);
            return barChart.calculateStat(values, 'median');
        });
        
        document.getElementById('averageTime').textContent = Math.round(stepAverages.reduce((sum, avg) => sum + avg, 0));
        document.getElementById('medianTime').textContent = Math.round(stepMedians.reduce((sum, med) => sum + med, 0));
    };

    // Year toggle handler
    const handleYearChange = async () => {
        const selectedYear = parseInt(document.querySelector('input[name="yearToggle"]:checked').value);
        await loadDataAndFilters(selectedYear);
        updateCharts();
    };

    // Add event listeners
    platformFilter.addEventListener('change', updateCharts);
    podFilter.addEventListener('change', updateCharts);
    monthFilter.addEventListener('change', updateCharts);
    document.querySelectorAll('input[name="statType"]').forEach(radio => {
        radio.addEventListener('change', updateCharts);
    });
    document.querySelectorAll('input[name="yearToggle"]').forEach(radio => {
        radio.addEventListener('change', handleYearChange);
    });

    // Initial load with 2024 data
    await loadDataAndFilters(2024);
    updateCharts();
}

// Start the application
init();
