function analyzeData() {
    const ctx = document.getElementById('chart').getContext('2d');
    const labels = trackingData.map(data => data.id);
    const durations = trackingData.map(data => data.duration);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Verweildauer (Sekunden)',
                data: durations,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}