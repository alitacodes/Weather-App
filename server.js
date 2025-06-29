const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());

// Serve static files like index.html
app.use(express.static(path.join(__dirname)));

// Route for home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Weather route
app.get('/weather', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  try {
    const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        units: 'metric',
        appid: process.env.OPENWEATHER_API_KEY
      }
    });

    res.json(weatherResponse.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// ✅ THIS IS WHAT YOU’RE MISSING
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
