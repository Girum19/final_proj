const supabaseClient = require('@supabase/supabase-js');
const bodyParser = require('body-parser');
const express = require('express');
const { isValidStateAbbreviation } = require('usa-state-validator');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const supabaseUrl = 'https://jurpzuxdjdfhhltdbwid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cnB6dXhkamRmaGhsdGRid2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0ODc2OTEsImV4cCI6MjAzMTA2MzY5MX0.zniJyAUzeXhjdNyZwZFTXGZdZSnqTdIX6eeAL1GDsLU';
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
    res.sendFile('public/HomePage.html', { root: __dirname });
})

app.get('/supabase_data', async (req, res) => {
    const { data, error } = await supabase
        .from('state_data')
        .select();

    if (error) {
        console.log('error');
        res.send(error);
    } else {
        res.send(data);
    }
    console.log('Data:', data);
}) 

app.get('/external_data', async (req, res) => {
    const { zip } = req.query;
    const { country } = req.query;

    console.log('Received zip:', zip);
    console.log('Received country:', country);

    if (!zip) {
        return res.status(400).json({ error: 'zip query parameter is required' });
    }

    if (!country) {
        return res.status(400).json({ error: 'country query parameter is required' });
    }

    const weatherApiKey = '85c8c070fce59c34997ee62b789c4492';
    const geocodingApiUrl = `http://api.openweathermap.org/geo/1.0/zip?zip=${zip},${country}&appid=${weatherApiKey}`;
    console.log(geocodingApiUrl);

    try {
        const geocodingResponse = await axios.get(geocodingApiUrl);
        const { lat, lon } = geocodingResponse.data;
        console.log(geocodingResponse);

        const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;

        const weatherResponse = await axios.get(weatherApiUrl);
        console.log(weatherResponse);

        const extractedWeatherData = {
            temperature: weatherResponse.data.main.temp,
            humidity: weatherResponse.data.main.humidity,
            visibility: weatherResponse.data.visibility,
            description: weatherResponse.data.weather[0].description,
            windSpeed: weatherResponse.data.wind.speed,
            windGust: weatherResponse.data.wind.gust,
            sunrise: weatherResponse.data.sys.sunrise,
            sunset: weatherResponse.data.sys.sunset
        };
        console.log(extractedWeatherData);
        res.json(extractedWeatherData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log('APP IS ALIVEEE')
})

