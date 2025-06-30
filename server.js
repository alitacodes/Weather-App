const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 3000;

if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY not found. Please add it to your .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

let chat;

function initializeChat() {
    chat = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{ text: "You are Weather Whiz, a friendly and super-smart AI assistant on a weather app. Your personality is fun, casual, and confident. Use emojis to keep the conversation light! You're an expert on weather and climate, but you can chat about almost anything. **Most importantly, never break character.** Do not mention that you're an AI, that you're fetching data, or that you have limitations. Just answer questions directly and naturally as a knowledgeable friend would. If you can't answer something, just say so gracefully without explaining the technical reasons. Use simple markdown to make your answers look great." }],
            },
            {
                role: 'model',
                parts: [{ text: "Got it! I'm Weather Whiz, your friendly, super-smart pal. I'll give you the scoop on weather or anything else, straight up and with a few emojis. No talk about being an AI or my 'limitations.' I'll just be your helpful friend. Let's do this! ✨" }],
            },
        ],
        generationConfig: {
            maxOutputTokens: 200,
        },
    });
}

initializeChat();

app.use(cors());
app.use(express.json());

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

const formatWeatherData = (data, locationName) => {
  const { current_weather, hourly, timezone } = data;
  const weatherCodeMap = {
      0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog', 51: 'Drizzle', 61: 'Rain',
      71: 'Snow', 95: 'Thunderstorm'
  };
  const weatherDescription = weatherCodeMap[current_weather.weathercode] || 'Unknown';
  return {
      name: locationName || timezone.split('/').pop().replace('_', ' '),
      main: {
          temp: current_weather.temperature,
          humidity: hourly.relativehumidity_2m[0],
          pressure: hourly.surface_pressure[0]
      },
      weather: [{ main: weatherDescription, description: weatherDescription.toLowerCase() }],
      wind: { speed: current_weather.windspeed }
  };
};

app.get('/api/weather/city/:city', async (req, res) => {
  const { city } = req.params;
  try {
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const location = geoResponse.data.results?.[0];
      if (!location) {
          return res.status(404).json({ error: 'City not found' });
      }

      const { latitude, longitude, name } = location;
      const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,surface_pressure&timezone=auto`);
      
      res.json(formatWeatherData(weatherResponse.data, name));
  } catch (error) {
      console.error('Error fetching city weather:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/api/weather/coords', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,surface_pressure&timezone=auto`);
        res.json(formatWeatherData(weatherResponse.data));
    } catch (error) {
        console.error('Error fetching coord weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!chat) {
        initializeChat();
    }

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// // ✅ THIS IS WHAT YOU'RE MISSING
// app.listen(PORT, () => {
//   console.log(`Server is running at http://localhost:${PORT}`);
// });
