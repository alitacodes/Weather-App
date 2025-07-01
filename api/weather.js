const axios = require('axios');

module.exports = async (req, res) => {
  const { city, lat, lon } = req.query;

  // City-based weather
  if (city) {
    try {
      const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const location = geoResponse.data.results?.[0];
      if (!location) return res.status(404).json({ error: 'City not found' });

      const { latitude, longitude, name } = location;
      const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,surface_pressure&timezone=auto`);
      return res.json(formatWeatherData(weatherResponse.data, name));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  }

  // Coords-based weather
  if (lat && lon) {
    try {
      const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,surface_pressure&timezone=auto`);
      return res.json(formatWeatherData(weatherResponse.data));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  }

  return res.status(400).json({ error: 'Missing city or coordinates' });
};

function formatWeatherData(data, locationName) {
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
}
