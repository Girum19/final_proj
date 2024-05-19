// Getting types location weather details
async function newLocation(event) {
    event.preventDefault(); 
    const location = document.getElementById('location-input').value;
    console.log(location)
    if (location) {
        await displayWeatherInfo(location);
    }else {
        await displayWeatherInfo();
    }
}


// Getting weather information using latitude and longitude
async function fetchWeatherData(latitude, longitude) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,precipitation,rain,showers,snowfall&hourly=temperature_2m,visibility&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration&temperature_unit=fahrenheit&timezone=auto&start_date=${getCurrentDate()}&end_date=${getNextWeekDate()}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
}

// Getting user's current location
async function getCurrentLocation() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            resolve({ latitude, longitude });
        });
    });
}

// Show the persons current location
async function displayCurrentLocation() {
    const { latitude, longitude } = await getCurrentLocation();
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=0`);
    const data = await response.json();
    console.log("Response data:", data);
    const address = data.display_name.split(', ');
    const city = address[address.length - 5]
    console.log("City:", city);
    document.getElementById('current-city').textContent = city;
}

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Function to get next date in YYYY-MM-DD format
function getNextWeekDate() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const year = nextWeek.getFullYear();
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const day = String(nextWeek.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// Adjust displayWeatherInfo to handle the new data structure
async function displayWeatherInfo(location) {
    const numberOfDaysToDisplay = 7;
    let latitude, longitude;
    if (location) {
        // Use the provided location
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${location}&format=json&addressdetails=1&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            latitude = data[0].lat;
            longitude = data[0].lon;
        } else {
            console.error('Location not found');
            return;
        }
    } else {
        // Use current location
        const { latitude: userLat, longitude: userLon } = await getCurrentLocation();
        latitude = userLat;
        longitude = userLon;
    }

    const hourlyForecastHeading = document.getElementById('hourly-forecast-heading');
    const locationName = location ? location : 'Current Location';
    hourlyForecastHeading.innerHTML = `Hourly Forecast for ${locationName}`;

    const weatherData = await fetchWeatherData(latitude, longitude);
    const hourlyForecasts = weatherData.hourly;
    const dailyForecasts = weatherData.daily;
    console.log('Daily Forecasts:', dailyForecasts);

    // Find the index of the current hour
    const currentHour = new Date().getHours();

    // Find the index of the current day
    const today = new Date().toLocaleDateString();
    const currentDayIndex = dailyForecasts.time.findIndex(day => new Date(day).toLocaleDateString() === today);

    // Clear existing forecast lists
    const hourlyForecastElement = document.getElementById('hourly-forecast-list');
    const dailyForecastElement = document.getElementById('daily-forecast-list');
    hourlyForecastElement.innerHTML = '';
    dailyForecastElement.innerHTML = '';

    // Display current hour for hourly forecast
    const currentHourForecastItem = document.createElement('div');
    currentHourForecastItem.classList.add('forecast-item');
    const formattedCurrentHour = formatHourlyTime(new Date(hourlyForecasts.time[currentHour]));
    const currentHourTemperature = hourlyForecasts.temperature_2m[currentHour];
    currentHourForecastItem.innerHTML = `
        <h4>Now</h4>
        <p>Temperature: ${currentHourTemperature}&deg;F</p>
    `;
    hourlyForecastElement.appendChild(currentHourForecastItem);

    // Display current day for daily forecast
    const currentDayMaxTemperature = dailyForecasts.temperature_2m_max[0];
    const currentDayMinTemperature = dailyForecasts.temperature_2m_min[0];
    const currentDayForecastItem = document.createElement('div');
    currentDayForecastItem.classList.add('forecast-item');
    currentDayForecastItem.innerHTML = `
        <h4>Today</h4>
        <p>Max Temperature: ${currentDayMaxTemperature}&deg;F</p>
        <p>Min Temperature: ${currentDayMinTemperature}&deg;F</p>
    `;
    dailyForecastElement.appendChild(currentDayForecastItem);

    // Loop through the remaining hourly forecasts
    for (let i = currentHour + 1; i < hourlyForecasts.time.length; i++) {
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        const formattedTime = formatHourlyTime(new Date(hourlyForecasts.time[i]));
        const temperature = hourlyForecasts.temperature_2m[i];
        forecastItem.innerHTML = `
            <h4>${formattedTime}</h4>
            <p>Temperature: ${temperature}&deg;F</p>
        `;
        hourlyForecastElement.appendChild(forecastItem);
    }

    // Loop through the remaining daily forecasts
    for (let i = currentDayIndex + 1; i < currentDayIndex + numberOfDaysToDisplay; i++) {
        if (i >= dailyForecasts.time.length) break; 
        console.log('Daily Forecast Timestamp:', dailyForecasts.time[i]);
        // Create forecast item and add it to the list
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        const dayName = formatDailyTime(new Date(dailyForecasts.time[i]));
        console.log(dayName);
        const maxTemperature = dailyForecasts.temperature_2m_max[i];
        const minTemperature = dailyForecasts.temperature_2m_min[i];
        // Add additional daily forecast data as needed
        forecastItem.innerHTML = `
            <h4>${dayName}</h4>
            <p>Max Temperature: ${maxTemperature}&deg;F</p>
            <p>Min Temperature: ${minTemperature}&deg;F</p>
        `;
        dailyForecastElement.appendChild(forecastItem);
    }
}

function formatDailyTime(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        // Invalid timestamp, return an empty string
        return '';
    }
    const options = { weekday: 'long' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function formatHourlyTime(timestamp) {
    const date = new Date(timestamp);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; 
    return `${day} ${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
}

function showDetails(detailedForecast) {
    alert(detailedForecast); 
}


window.onload = function() {
    displayCurrentLocation();
    displayWeatherInfo();
};





