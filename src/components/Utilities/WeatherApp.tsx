'use client';

import React, { useState, useCallback } from 'react';

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  description: string;
  icon: string;
  pressure: number;
  visibility: number;
  timezone: string;
}

const WEATHER_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Clear sky', icon: '\u2600\uFE0F' },
  1: { desc: 'Mainly clear', icon: '\uD83C\uDF24\uFE0F' },
  2: { desc: 'Partly cloudy', icon: '\u26C5' },
  3: { desc: 'Overcast', icon: '\u2601\uFE0F' },
  45: { desc: 'Fog', icon: '\uD83C\uDF2B\uFE0F' },
  48: { desc: 'Rime fog', icon: '\uD83C\uDF2B\uFE0F' },
  51: { desc: 'Light drizzle', icon: '\uD83C\uDF26\uFE0F' },
  53: { desc: 'Moderate drizzle', icon: '\uD83C\uDF26\uFE0F' },
  55: { desc: 'Dense drizzle', icon: '\uD83C\uDF27\uFE0F' },
  61: { desc: 'Slight rain', icon: '\uD83C\uDF27\uFE0F' },
  63: { desc: 'Moderate rain', icon: '\uD83C\uDF27\uFE0F' },
  65: { desc: 'Heavy rain', icon: '\uD83C\uDF27\uFE0F' },
  71: { desc: 'Slight snow', icon: '\uD83C\uDF28\uFE0F' },
  73: { desc: 'Moderate snow', icon: '\uD83C\uDF28\uFE0F' },
  75: { desc: 'Heavy snow', icon: '\uD83C\uDF28\uFE0F' },
  77: { desc: 'Snow grains', icon: '\uD83C\uDF28\uFE0F' },
  80: { desc: 'Slight showers', icon: '\uD83C\uDF26\uFE0F' },
  81: { desc: 'Moderate showers', icon: '\uD83C\uDF27\uFE0F' },
  82: { desc: 'Violent showers', icon: '\uD83C\uDF27\uFE0F' },
  85: { desc: 'Slight snow showers', icon: '\uD83C\uDF28\uFE0F' },
  86: { desc: 'Heavy snow showers', icon: '\uD83C\uDF28\uFE0F' },
  95: { desc: 'Thunderstorm', icon: '\u26C8\uFE0F' },
  96: { desc: 'Thunderstorm with hail', icon: '\u26C8\uFE0F' },
  99: { desc: 'Severe thunderstorm', icon: '\u26C8\uFE0F' },
};

const PRESET_CITIES = [
  'Buenos Aires',
  'New York',
  'Madrid',
  'London',
  'Tokyo',
];

export default function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');

  const fetchWeather = useCallback(async (cityName: string) => {
    if (!cityName.trim()) return;
    setLoading(true);
    setError('');
    setWeather(null);

    try {
      // Step 1: Geocode city name
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError('City not found');
        return;
      }

      const { latitude, longitude, name, country_code } = geoData.results[0];

      // Step 2: Fetch weather with coordinates
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m` +
        `&timezone=auto`
      );
      const data = await weatherRes.json();
      const current = data.current;

      const code = current.weather_code;
      const weatherInfo = WEATHER_CODES[code] || { desc: 'Unknown', icon: '\u2601\uFE0F' };

      setWeather({
        city: name,
        country: country_code || '',
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        wind: Math.round(current.wind_speed_10m),
        description: weatherInfo.desc,
        icon: weatherInfo.icon,
        pressure: Math.round(current.surface_pressure),
        visibility: 10,
        timezone: data.timezone || '',
      });
    } catch {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchWeather(city);
  }, [city, fetchWeather]);

  return (
    <div className="weather-container">
      <div className="weather-search">
        <input
          className="weather-input"
          type="text"
          placeholder="Search city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="weather-btn" onClick={() => fetchWeather(city)}>Go</button>
      </div>

      <div className="weather-presets">
        {PRESET_CITIES.map((c) => (
          <button
            key={c}
            className="weather-preset-btn"
            onClick={() => { setCity(c); fetchWeather(c); }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <div className="weather-loading">Loading...</div>}
      {error && <div className="weather-error">{error}</div>}

      {weather && (
        <div className="weather-card">
          <div className="weather-main">
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-temp">{weather.temp}°C</div>
            <div className="weather-location">
              {weather.city}{weather.country ? `, ${weather.country}` : ''}
            </div>
            <div className="weather-desc">{weather.description}</div>
          </div>
          <div className="weather-details">
            <div className="weather-detail">
              <span>Feels like</span><span>{weather.feelsLike}°C</span>
            </div>
            <div className="weather-detail">
              <span>Humidity</span><span>{weather.humidity}%</span>
            </div>
            <div className="weather-detail">
              <span>Wind</span><span>{weather.wind} km/h</span>
            </div>
            <div className="weather-detail">
              <span>Pressure</span><span>{weather.pressure} hPa</span>
            </div>
          </div>
        </div>
      )}

      {!weather && !loading && !error && (
        <div className="weather-empty">
          <div className="weather-empty-icon">{'\uD83C\uDF24\uFE0F'}</div>
          <div>Search for a city or pick one below</div>
        </div>
      )}
    </div>
  );
}
