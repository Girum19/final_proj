async function fetchDataFromExternalProvider() {
    try {
        const zip = document.getElementById('zip').value;
        const country = document.getElementById('country').value;
        const response = await fetch(`/external_data?zip=${zip}&country=${country}`);

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return null;
    }
}


async function createChart() {
    try {
        const weatherData = await fetchDataFromExternalProvider();
        console.log(weatherData);

        const temperatureFahrenheit = (weatherData.temperature - 273.15) * 9 / 5 + 32;

        const data = [
            { label: 'Temperature (°F)', value: temperatureFahrenheit.toFixed(2), color: 'rgba(255, 99, 132, 1)' }, // Red
            { label: 'Humidity (%)', value: `${weatherData.humidity}%`, color: 'rgba(54, 162, 235, 1)' }, // Blue
            { label: 'Wind Speed (mph)', value: `${weatherData.windSpeed} mph`, color: 'rgba(255, 205, 86, 1)' }, // Yellow
            { label: 'Wind Gust (mph)', value: `${weatherData.windGust || 0} mph`, color: 'rgba(75, 192, 192, 1)' } // Green
        ];

        updateMessageBox(data);

        document.getElementById('messageBox').style.display = 'block';

        var container = document.getElementById('chart-container');

        container.innerHTML = '';

        var canvas = document.createElement('canvas');

        container.appendChild(canvas);

        var ctx = canvas.getContext('2d');

        const datasets = data.map(({ label, value, color }) => ({
            label: label,
            data: [{ x: label, y: parseFloat(value) }],
            backgroundColor: color,
            pointBackgroundColor: color,
            pointRadius: 5,
            pointHoverRadius: 7
        }));

        const weatherChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                scales: {
                    x: {
                        type: 'category',
                        labels: datasets.map(dataset => dataset.label),
                        title: {
                            display: true,
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: Math.max(...data.map(item => parseFloat(item.value)))
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error.message);
    }
}

function updateMessageBox(data) {
    const messageBox = document.getElementById('messageBox');
    let message = '';

    const temperature = parseFloat(data.find(item => item.label === 'Temperature (°F)').value);
    const humidity = parseFloat(data.find(item => item.label === 'Humidity (%)').value.replace('%', ''));
    const windSpeed = parseFloat(data.find(item => item.label === 'Wind Speed (mph)').value.replace(' mph', ''));
    const windGust = parseFloat(data.find(item => item.label === 'Wind Gust (mph)').value.replace(' mph', ''));

    if (temperature > 80) {
        message = 'It\'s hot outside! Consider staying hydrated and seeking shade.';
    } else if (temperature < 40) {
        message = 'It\'s cold outside! Bundle up and dress warmly.';
    } else if (humidity >= 65 && temperature > 60) {
        message = "High humidity and warmer temperatures, weather will feel warmer than it actually is."
    } else if (humidity > 65) {
        message = 'High humidity can make it feel warmer than it actually is. Be prepared for muggy conditions.';
    } else if (windSpeed > 20) {
        message = 'Windy conditions! Avoid going outside unless necessary.';
    } else if (windGust > 15) {
        message = "Slight wind gusts. Nothing to worry over :D."
    } else if ((temperature > 55 && temperature < 85) && (humidity < 65) && (windSpeed < 20)) {
        message = 'The weather looks good for outdoor activities. Enjoy your day!';
    }
    messageBox.textContent = message;
}

async function fetchDataBaseData() {
    try {
        const response = await fetch('/supabase_data');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const databaseData = await response.json();
        console.log(databaseData)
        return databaseData;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return null;
    }
}

function getStateGeometry(stateName, statesData) {
    const stateFeature = statesData.features.find(feature => feature.properties.name === stateName);
    if (stateFeature) {
        return stateFeature.geometry;
    } else {
        console.error(`Geometry not found for state: ${stateName}`);
        return null; 
    }
}

async function createMapWithData(statesData) {
    try {
        const databaseData = await fetchDataBaseData();
        if (!databaseData) return;  

        console.log("Database Data:", databaseData); 

        const geoJSONFeatures = databaseData.map(state => ({
            "type": "Feature",
            "properties": {
                "name": state.name,
                "temperature": state.temperature 
            },
            "geometry": getStateGeometry(state.name, statesData)
        }));

        console.log("GeoJSON Features:", geoJSONFeatures); 

        const geoJSONData = {
            "type": "FeatureCollection",
            "features": geoJSONFeatures
        };

        createMap(geoJSONData);
    } catch (error) {
        console.error('Error creating map with data:', error.message);
    }
}

function createMap(statesData) {
    console.log("Data with temperature:", statesData);
    var map = L.map('map').setView([37.8, -96], 4.41);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    console.log(statesData);

    fetchDataBaseData()
        .then(function (temperature) {
            L.geoJson(statesData, {
                style: function (feature) {
                    const stateName = feature.properties.name;
                    const stateTemperature = feature.properties.temperature;
                    console.log("State Name:", stateName, "Temperature:", stateTemperature);
                    
                    return {
                        fillColor: getColor(stateTemperature),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: function (feature, layer) {
                    const temperature = feature.properties.temperature;
                    layer.bindPopup(feature.properties.name + "<br>Temperature: " + temperature + "°F");
                }
            }).addTo(map);
        })
        .catch(function (error) {
            console.error('Error fetching temperature data:', error);
        });
}

function getColor(temperature) {
    let color;
    if (temperature > 100) {
        color = '#800026';
    } else if (temperature > 90) {
        color = '#BD0026';
    } else if (temperature > 70) {
        color = '#E31A1C';
    } else if (temperature > 65) {
        color = '#FC4E2A';
    } else if (temperature > 60) {
        color = '#FD8D3C';
    } else if (temperature > 55) {
        color = '#FEB24C';
    } else if (temperature > 50) {
        color = '#FED976';
    } else {
        color = '#FFEDA0';
    }

    return color;
}

window.onload = createMapWithData(statesData);

