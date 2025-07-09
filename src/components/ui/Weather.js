import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';

const Weather = () => {
    const [weather, setWeather] = useState(null);

    // Placeholder for weather data. In a real app, this would be fetched from an API.
    useEffect(() => {
        const fetchWeather = () => {
            // This is mock data
            const mockWeather = {
                temp: 72,
                condition: 'Sunny',
            };
            setWeather(mockWeather);
        };
        fetchWeather();
    }, []);

    const getWeatherIcon = (condition) => {
        switch (condition) {
            case 'Sunny':
                return <Sun className="text-yellow-400" />;
            case 'Cloudy':
                return <Cloud className="text-gray-400" />;
            case 'Rain':
                return <CloudRain className="text-blue-400" />;
            case 'Snow':
                return <CloudSnow className="text-white" />;
            default:
                return <Sun className="text-yellow-400" />;
        }
    };

    if (!weather) return null;

    return (
        <div className="flex items-center space-x-2 text-white">
            <span>{weather.temp}°F</span>
            {getWeatherIcon(weather.condition)}
        </div>
    );
};

export default Weather;
