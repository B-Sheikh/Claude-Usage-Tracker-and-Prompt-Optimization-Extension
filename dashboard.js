/* global browser, Chart */
'use strict';

async function initDashboard() {
    const result = await browser.storage.local.get('usageHistory');
    const history = result.usageHistory || {};

    const dates = Object.keys(history).sort();
    const values = dates.map(d => history[d]);

    // Update Stats
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? Math.round(total / values.length) : 0;
    const peak = values.length > 0 ? Math.max(...values) : 0;

    document.getElementById('stat-total').textContent = total.toLocaleString();
    document.getElementById('stat-avg').textContent = avg.toLocaleString();
    document.getElementById('stat-peak').textContent = peak.toLocaleString();

    // Render Chart
    const ctx = document.getElementById('usageChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(d => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Tokens Used',
                data: values,
                borderColor: '#2c84db',
                backgroundColor: 'rgba(44, 132, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#888' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#888' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initDashboard);
