async function init() {
    let rawData = [];
    const barChart = new BarChart();
    const trendChart = new TrendChart();
    const prDistribution = new PRDistributionChart();
    const testerDistribution = new TesterDistributionChart();

    // Helper function to get quarter from date
    const getQuarter = (date) => {
        const d = new Date(date);
        const month = d.getMonth(); // 0-11
        const year = d.getFullYear();
        const quarter = Math.floor(month / 3) + 1;
        return `Q${quarter} - ${year}`;
    };

    // Initialize filter elements
    const platformFilter = document.getElementById('platformFilter');
    const orgFilter = document.getElementById('orgFilter');
    const podFilter = document.getElementById('podFilter');
    const monthFilter = document.getElementById('monthFilter');
    const quarterFilter = document.getElementById('quarterFilter');

    // Function to load data and populate filters
    const loadDataAndFilters = async (year) => {
        // Fetch data for the selected year
        rawData = await fetchData(year);
        console.log('Raw data loaded:', rawData.length, 'rows');
        if (rawData.length > 1) {
            console.log('Headers:', rawData[0]);
            console.log('First data row:', rawData[1]);
        }

        // Clear existing filter options (except "All")
        platformFilter.innerHTML = '<option value="all">All</option>';
        orgFilter.innerHTML = '<option value="all">All</option>';
        podFilter.innerHTML = '<option value="all">All</option>';
        monthFilter.innerHTML = '<option value="all">All</option>';
        quarterFilter.innerHTML = '<option value="all">All</option>';

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

        // Get all quarters from all relevant date columns
        const quarters = [...new Set(
            rawData.slice(1).flatMap(row => {
                return Array.from({length: 7}, (_, i) => row[i + 3])
                    .filter(date => date)
                    .map(date => getQuarter(date));
            })
        )].sort((a, b) => {
            // Sort quarters properly: Q1-2024, Q2-2024, Q3-2024, Q4-2024, Q1-2025...
            const [qa, ya] = a.split(' - ');
            const [qb, yb] = b.split(' - ');
            if (ya !== yb) return ya.localeCompare(yb);
            return qa.localeCompare(qb);
        });

        // Populate quarter filter
        quarters.forEach(quarter => {
            const option = document.createElement('option');
            option.value = quarter;
            option.textContent = quarter;
            quarterFilter.appendChild(option);
        });

        // Populate platform filter
        const platforms = [...new Set(rawData.slice(1).map(row => row[1]?.trim()))].filter(p => p);
        console.log('Available platforms:', platforms);
        platforms.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            platformFilter.appendChild(option);
        });

        // Populate org filter
        const orgs = [...new Set(rawData.slice(1).map(row => row[11]?.trim()))].filter(org => org);
        console.log('Available orgs:', orgs);
        orgs.forEach(org => {
            const option = document.createElement('option');
            option.value = org;
            option.textContent = org;
            orgFilter.appendChild(option);
        });

        // Populate pod filter
        const pods = [...new Set(rawData.slice(1).map(row => row[10]?.trim()))].filter(pod => pod);
        console.log('Available pods:', pods);
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
        const selectedOrg = orgFilter.value;
        const selectedPod = podFilter.value;
        const selectedMonth = monthFilter.value;
        const selectedQuarter = quarterFilter.value;
        
        console.log('Filters:', {
            platform: selectedPlatform,
            org: selectedOrg,
            pod: selectedPod,
            month: selectedMonth,
            quarter: selectedQuarter
        });
        
        // First filter by platform
        let filteredRows = rawData.slice(1).filter(row => 
            selectedPlatform === 'all' || (row[1] && row[1].trim() === selectedPlatform.trim())
        );
        console.log('After platform filter:', filteredRows.length, 'rows');
        
        // Debug: Show unique orgs in platform-filtered data
        if (selectedPlatform !== 'all' && filteredRows.length > 0) {
            const orgsInPlatform = [...new Set(filteredRows.map(row => row[11]))].filter(org => org);
            console.log(`Orgs available in platform "${selectedPlatform}":`, orgsInPlatform);
        }

        // Then filter by org
        filteredRows = filteredRows.filter(row => 
            selectedOrg === 'all' || (row[11] && row[11].trim() === selectedOrg.trim())
        );
        console.log('After org filter:', filteredRows.length, 'rows');
        
        // Debug: Check for value mismatch
        if (selectedOrg !== 'all' && filteredRows.length === 0) {
            console.warn(`No tickets found for Org "${selectedOrg}" in Platform "${selectedPlatform}"`);
            // Show what values we're comparing
            const sampleRow = rawData.slice(1).find(row => row[1] === selectedPlatform);
            if (sampleRow) {
                console.log('Sample org value in data:', `"${sampleRow[11]}"`, 'Length:', sampleRow[11]?.length);
                console.log('Selected org value:', `"${selectedOrg}"`, 'Length:', selectedOrg.length);
            }
        }

        // Then filter by pod
        filteredRows = filteredRows.filter(row => 
            selectedPod === 'all' || (row[10] && row[10].trim() === selectedPod.trim())
        );
        console.log('After pod filter:', filteredRows.length, 'rows');
        
        if (filteredRows.length > 0) {
            console.log('Sample filtered row:', filteredRows[0]);
        }

        // Calculate all durations
        const durations = calculateDurations(filteredRows);
        console.log('Calculated durations:', durations.length, 'items');
        if (durations.length > 0) {
            console.log('Sample duration:', durations[0]);
        }
        
        // Then filter by selected month if needed
        const monthFilteredDurations = selectedMonth === 'all' 
            ? durations 
            : durations.filter(duration => {
                return Object.values(duration).some(metric => 
                    metric && metric.month === selectedMonth
                );
            });

        // Then filter by selected quarter if needed
        const quarterFilteredDurations = selectedQuarter === 'all'
            ? monthFilteredDurations
            : monthFilteredDurations.filter(duration => {
                return Object.values(duration).some(metric => {
                    if (!metric || !metric.month) return false;
                    // Extract date from month (YYYY-MM format)
                    const [year, month] = metric.month.split('-');
                    const date = new Date(year, parseInt(month) - 1, 1);
                    const quarter = getQuarter(date);
                    return quarter === selectedQuarter;
                });
            });

        const statType = document.querySelector('input[name="statType"]:checked').value;

        // Check if we have data to display
        if (quarterFilteredDurations.length === 0) {
            console.warn('No data to display after filtering');
            // You could add a visual indicator here
        }

        // Update all charts
        barChart.update(quarterFilteredDurations, statType);
        trendChart.update(quarterFilteredDurations, statType);
        prDistribution.update(quarterFilteredDurations);
        testerDistribution.update(quarterFilteredDurations);
    };

    // Year toggle handler
    const handleYearChange = async () => {
        const selectedYear = parseInt(document.querySelector('input[name="yearToggle"]:checked').value);
        await loadDataAndFilters(selectedYear);
        updateCharts();
    };

    // Add event listeners
    platformFilter.addEventListener('change', updateCharts);
    orgFilter.addEventListener('change', updateCharts);
    podFilter.addEventListener('change', updateCharts);
    monthFilter.addEventListener('change', updateCharts);
    quarterFilter.addEventListener('change', updateCharts);
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
