import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SavedCityCard({ cityName, apiKey, onSelect }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchMinimalWeather = async () => {
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${apiKey}`
        );
        setWeather(res.data);
      } catch (err) {
        console.error(`Could not fetch weather for saved city: ${cityName}`);
      }
    };
    fetchMinimalWeather();
  }, [cityName, apiKey]);

  return (
    <div 
      onClick={() => onSelect(cityName)}
      className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-lg cursor-pointer hover:bg-slate-800/60 transition-all flex justify-between items-center group active:scale-95"
    >
      <div className="text-left flex flex-col justify-between h-full">
        <h3 className="text-2xl font-bold text-white drop-shadow-md">{cityName}</h3>
        {weather ? (
          <p className="text-sm font-medium text-sky-300 capitalize drop-shadow-md mt-4">
            {weather.weather[0].description}
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-400 mt-4">Loading...</p>
        )}
      </div>
      
      <div className="text-right flex flex-col justify-between items-end h-full">
        {weather ? (
          <>
            <span className="text-5xl font-light text-white drop-shadow-xl tracking-tighter">
              {Math.round(weather.main.temp)}°
            </span>
            <span className="text-xs font-medium text-slate-300 drop-shadow-md mt-3">
              H:{Math.round(weather.main.temp_max)}° L:{Math.round(weather.main.temp_min)}°
            </span>
          </>
        ) : (
          <span className="text-5xl font-light text-slate-600 animate-pulse">--°</span>
        )}
      </div>
    </div>
  );
}

export default SavedCityCard;