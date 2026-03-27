import React, { useState } from 'react';
import axios from 'axios';
import { Search, Cloud, Shirt, MapPin, AlertCircle } from 'lucide-react';
import { getClothingSuggestions, getCategoryIds } from './weatherLogic';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [activities, setActivities] = useState([]); 
  const [error, setError] = useState('');
  const [fsqError, setFsqError] = useState(''); 

  const WEATHER_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  const FOURSQUARE_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY;

  const fetchEverything = async (e) => {
    e.preventDefault();
    if (!city) return;

    setError('');
    setFsqError('');
    setActivities([]); 

    try {
      // 1. Fetch Weather Data
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_KEY}`
      );
      setWeather(weatherRes.data);

      const { lat, lon } = weatherRes.data.coord;
      const categories = getCategoryIds(weatherRes.data.main.temp, weatherRes.data.weather[0].main);

      // 2. Fetch Places from Foursquare (Using the New API via Proxy)
      try {
        const placesRes = await axios.get(
          '/foursquare/places/search', 
          {
            params: {
              ll: `${lat},${lon}`,
              categories: categories,
              limit: 4
              // FIX: Removed the 'fields' parameter entirely!
              // The new API returns core fields by default and crashes if you ask for them.
            },
            headers: {
              Authorization: `Bearer ${FOURSQUARE_KEY}`, 
              accept: 'application/json',
              'X-places-api-version': '2025-02-05' 
            }
          }
        );
        
        setActivities(placesRes.data.results || placesRes.data || []);
      } catch (placeErr) {
        console.error("Foursquare Detail:", placeErr.response?.data || placeErr);
        const msg = placeErr.response?.data?.message || "Check your Foursquare API Key and Endpoint.";
        setFsqError(msg);
      }

    } catch (err) {
      setError('City not found. Please check your spelling.');
      setWeather(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans text-center">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-black mb-2 flex justify-center items-center gap-3">
            WeatherWise <Cloud className="text-sky-400" />
          </h1>
          <p className="text-slate-400 text-sm">Smart recommendations for your day.</p>
        </header>

        <form onSubmit={fetchEverything} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Enter city..."
            className="flex-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button type="submit" className="p-4 bg-sky-600 rounded-2xl hover:bg-sky-500 shadow-lg">
            <Search size={22} />
          </button>
        </form>

        {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl mb-6 border border-red-500/20">{error}</div>}

        {weather && (
          <div className="space-y-6 text-left">
            <section className="bg-slate-800 p-6 rounded-3xl border border-white/5 shadow-2xl flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">{weather.name}</h2>
                <p className="text-sky-400 capitalize font-medium">{weather.weather[0].description}</p>
              </div>
              <div className="text-5xl font-black">{Math.round(weather.main.temp)}°</div>
            </section>

            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-300 uppercase text-xs tracking-widest">
                <Shirt size={16} className="text-sky-400" /> Clothing Advice
              </h3>
              <div className="flex flex-wrap gap-2">
                {getClothingSuggestions(weather.main.temp, weather.weather[0].main).map((item, i) => (
                  <span key={i} className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
              <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-300 uppercase text-xs tracking-widest">
                <MapPin size={16} className="text-emerald-400" /> Recommended Nearby
              </h3>
              
              {fsqError ? (
                <div className="text-xs text-orange-400 bg-orange-400/10 p-4 rounded-xl flex items-start gap-2 border border-orange-400/20">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1 underline text-orange-300">API Notice:</p>
                    <p className="opacity-90">{fsqError}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.length > 0 ? (
                    activities.map((place, index) => (
                      <div key={place.fsq_id || place.id || index} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="font-bold text-slate-100">{place.name}</div>
                        <div className="text-xs text-slate-500">{place.location?.formatted_address || place.location?.address || "Address hidden"}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm italic">Searching for local spots...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;