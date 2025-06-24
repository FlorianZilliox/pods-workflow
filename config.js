// Constants for API
const SHEET_ID_2024 = '1dU5Fa_8m6Uw4HQ3WTSncs9Bhe449ML-aSbAoPmT1o1c';
const SHEET_ID_2025 = '1d8m2iyaGIcLysV5QtumYzGH8bda5w-xdufTBS8Fdyj8'; // Replace with your 2025 Google Sheet ID
const API_KEY = 'AIzaSyD8uw55tuJcdtqUanZ7J3DbsZeHCn-eSrM';
const RANGE = 'Data!A:K'; // Updated to include column K (Pod)

// Fetch data from Google Sheets
async function fetchData(year = 2024) {
    const sheetId = year === 2024 ? SHEET_ID_2024 : SHEET_ID_2025;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${RANGE}?key=${API_KEY}`;
    const response = await fetch(url);
    const result = await response.json();
    return result.values || [];
}

// Round to nearest integer
function roundToNearest(value) {
    return Math.round(value);
}

// Calculate business days between two dates
function calculateBusinessDays(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    // Normalize to start of day
    currentDate.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Count business days
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        // 0 is Sunday, 6 is Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return count - 1; // Subtract 1 because we don't count the start day
}

// Calculate durations for different steps
function calculateDurations(rows) {
    return rows.map(row => {
        const dates = {
            toDo: row[2] ? new Date(row[2]) : null,
            dev: row[3] ? new Date(row[3]) : null,
            pr: row[4] ? new Date(row[4]) : null,
            dr: row[5] ? new Date(row[5]) : null,
            rft: row[6] ? new Date(row[6]) : null,
            test: row[7] ? new Date(row[7]) : null,
            signoff: row[8] ? new Date(row[8]) : null,
            resolved: row[9] ? new Date(row[9]) : null,
        };

        // Calculate PR Review Time with conditional logic
        let prReviewTime = null;
        let prReviewEndDate = null;
        if (dates.pr) {
            if (dates.dr) {
                prReviewTime = calculateBusinessDays(dates.pr, dates.dr);
                prReviewEndDate = dates.dr;
            } else if (dates.rft) {
                prReviewTime = calculateBusinessDays(dates.pr, dates.rft);
                prReviewEndDate = dates.rft;
            }
        }

        // Format date to YYYY-MM
        const formatMonth = (date) => date ? date.toISOString().slice(0, 7) : null;

        return {
            'Backlog Time': dates.toDo && dates.dev ? {
                value: calculateBusinessDays(dates.toDo, dates.dev),
                month: formatMonth(dates.dev)
            } : null,
            'Development Time': dates.dev && dates.pr ? {
                value: calculateBusinessDays(dates.dev, dates.pr),
                month: formatMonth(dates.pr)
            } : null,
            'Pull Request Time': prReviewTime ? {
                value: prReviewTime,
                month: formatMonth(prReviewEndDate)
            } : null,
            'Design Review Time': dates.dr && dates.rft ? {
                value: calculateBusinessDays(dates.dr, dates.rft),
                month: formatMonth(dates.rft)
            } : null,
            'Tester Assignment Time': dates.rft && dates.test ? {
                value: calculateBusinessDays(dates.rft, dates.test),
                month: formatMonth(dates.test)
            } : null,
            'Testing Time': dates.test && dates.signoff ? {
                value: calculateBusinessDays(dates.test, dates.signoff),
                month: formatMonth(dates.signoff)
            } : null,
            'PO Validation Time': dates.signoff && dates.resolved ? {
                value: calculateBusinessDays(dates.signoff, dates.resolved),
                month: formatMonth(dates.resolved)
            } : null,
            'Full Cycle Time': dates.toDo && dates.resolved ? {
                value: calculateBusinessDays(dates.toDo, dates.resolved),
                month: formatMonth(dates.resolved)
            } : null,
            'Dev Cycle Time': dates.dev && dates.resolved ? {
                value: calculateBusinessDays(dates.dev, dates.resolved),
                month: formatMonth(dates.resolved)
            } : null
        };
    });
}
