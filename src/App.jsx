import React, { useState, useEffect } from 'react';
import axios from 'axios';
// NEW: Imported 'Umbrella' for the new clothing categories
import { Search, Cloud, Shirt, MapPin, AlertCircle, Home, Footprints, Thermometer, Wind, Droplets, ArrowDownUp, CalendarDays, List, ChevronLeft, Umbrella } from 'lucide-react';
import { getClothingSuggestions, getCategoryIds } from './weatherLogic';
import LocationCard from './LocationCard'; 
import SavedCityCard from './SavedCityCard'; 

const getBackgroundImage = (weatherMain) => {
  if (!weatherMain) return 'none';
  const condition = weatherMain.toLowerCase();
  if (condition.includes('snow')) {
    return `url('/bgsnow.png')`; 
  }
  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
    return `url('/bgrain.png')`;
  }
  return `url('/bg.png')`;
};

// NEW: Helper function to sort clothes into categories and add emojis!
const categorizeClothing = (items) => {
  const categories = {
    base: { title: "Base Layers", icon: Shirt, color: "text-sky-400", items: [] },
    outer: { title: "Outerwear", icon: Cloud, color: "text-slate-300", items: [] },
    acc: { title: "Accessories & Gear", icon: Umbrella, color: "text-emerald-400", items: [] }
  };

  items.forEach(item => {
    const lower = item.toLowerCase();
    let emoji = '👕';
    let cat = 'base';

    // Sort into Outerwear
    if (lower.includes('coat') || lower.includes('jacket')) {
      emoji = '🧥';
      cat = 'outer';
    } 
    // Sort into Accessories & Gear
    else if (lower.includes('umbrella') || lower.includes('sunglasses') || lower.includes('boots') || lower.includes('scarf') || lower.includes('gloves') || lower.includes('hat') || lower.includes('sunscreen')) {
      if (lower.includes('umbrella')) emoji = '☂️';
      else if (lower.includes('sunglasses')) emoji = '🕶️';
      else if (lower.includes('boots') || lower.includes('shoes')) emoji = '🥾';
      else if (lower.includes('scarf')) emoji = '🧣';
      else if (lower.includes('gloves')) emoji = '🧤';
      else if (lower.includes('hat') || lower.includes('beanie')) emoji = '🧢';
      else if (lower.includes('sunscreen')) emoji = '🧴';
      cat = 'acc';
    } 
    // Default to Base Layers
    else {
      if (lower.includes('shorts')) emoji = '🩳';
      else if (lower.includes('jeans') || lower.includes('pants')) emoji = '👖';
      else if (lower.includes('sweater')) emoji = '🧶';
      cat = 'base';
    }

    categories[cat].items.push({ name: item, emoji });
  });

  return categories;
};

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]); 
  const [activities, setActivities] = useState([]); 
  const [error, setError] = useState('');
  const [fsqError, setFsqError] = useState(''); 
  const [activeTab, setActiveTab] = useState('home'); 
  
  const [savedCities, setSavedCities] = useState([]);
  const [showCityList, setShowCityList] = useState(false);

  const WEATHER_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  const FOURSQUARE_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY;

  // 1. AUTO-LOAD LOGIC
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('weatherWiseCities')) || [];
    setSavedCities(history);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { fetchData(null, position.coords.latitude, position.coords.longitude); },
        (err) => { loadSavedCity(); }
      );
    } else {
      loadSavedCity(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSavedCity = () => {
    const lastCity = localStorage.getItem('weatherWiseCity');
    if (lastCity) {
      setCity(lastCity);
      fetchData(lastCity);
    }
  };

  // 2. THE MAIN ENGINE
  const fetchData = async (targetCity, lat = null, lon = null) => {
    if (!targetCity && (!lat || !lon)) return false;

    setError('');
    setFsqError('');
    setActivities([]); 
    setForecast([]); 

    try {
      const weatherUrl = lat && lon 
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&units=metric&appid=${WEATHER_KEY}`;

      const weatherRes = await axios.get(weatherUrl);
      setWeather(weatherRes.data);

      const fetchedCityName = weatherRes.data.name;
      setCity(fetchedCityName);
      
      localStorage.setItem('weatherWiseCity', fetchedCityName); 
      setSavedCities(prevCities => {
        const updatedList = [fetchedCityName, ...prevCities.filter(c => c !== fetchedCityName)].slice(0, 5); 
        localStorage.setItem('weatherWiseCities', JSON.stringify(updatedList));
        return updatedList;
      });

      const { lat: fetchedLat, lon: fetchedLon } = weatherRes.data.coord;
      const categories = getCategoryIds(weatherRes.data.main.temp, weatherRes.data.weather[0].main);

      // Fetch Forecast
      try {
        const forecastUrl = lat && lon 
          ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`
          : `https://api.openweathermap.org/data/2.5/forecast?q=${targetCity}&units=metric&appid=${WEATHER_KEY}`;

        const forecastRes = await axios.get(forecastUrl);
        const dailyData = forecastRes.data.list.filter(reading => reading.dt_txt.includes("12:00:00"));
        setForecast(dailyData);
      } catch (forecastErr) { console.error("Forecast failed:", forecastErr); }

      // Fetch Places
      try {
        const placesRes = await axios.get('/foursquare/places/search', {
            params: { ll: `${fetchedLat},${fetchedLon}`, categories: categories, limit: 4 },
            headers: { Authorization: `Bearer ${FOURSQUARE_KEY}`, accept: 'application/json', 'X-places-api-version': '2025-02-05' }
        });
        setActivities(placesRes.data.results || placesRes.data || []);
      } catch (placeErr) {
        setFsqError(placeErr.response?.data?.message || "Check your API Key.");
      }

      return true; 

    } catch (err) {
      setError('City not found. Please check your spelling.');
      setWeather(null);
      return false; 
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!city) return;
    
    const success = await fetchData(city);
    if (success) {
      setShowCityList(false);
    }
  };

  const handleSelectSavedCity = (selectedCity) => {
    setShowCityList(false);
    setCity(selectedCity);
    fetchData(selectedCity);
  };

  const currentBg = weather ? getBackgroundImage(weather.weather[0].main) : 'none';

  return (
    <>
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: currentBg }}
      />

      <div className="min-h-screen w-full text-white font-sans text-center pb-[12vh]">
        <div className="max-w-md mx-auto p-6">

          {/* THE SAVED CITIES LIST SCREEN */}
          {showCityList ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-left space-y-4 pb-12">
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setShowCityList(false)}
                  className="p-2 bg-slate-900/60 backdrop-blur-xl rounded-full border border-white/10 hover:bg-slate-800/60 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold drop-shadow-md">Locations</h1>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Search for a city..."
                  className="flex-1 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder:text-slate-400 shadow-xl"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <button type="submit" className="p-4 bg-sky-600/90 backdrop-blur-md rounded-2xl hover:bg-sky-500 shadow-xl transition-colors border border-sky-400/20">
                  <Search size={22} />
                </button>
              </form>

              {error && <div className="p-4 mb-4 bg-red-500/80 backdrop-blur-md text-white font-bold rounded-xl border border-red-400/50 shadow-lg">{error}</div>}

              {savedCities.length > 0 ? (
                <div className="space-y-4">
                  {savedCities.map((savedCity, index) => (
                    <SavedCityCard 
                      key={index} 
                      cityName={savedCity} 
                      apiKey={WEATHER_KEY} 
                      onSelect={handleSelectSavedCity} 
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-300 italic text-center mt-12 text-sm drop-shadow-md">Search for a city above to get started.</p>
              )}
            </div>
          ) : (
            /* --- MAIN APP DASHBOARD --- */
            <>
              {/* SCREEN 1: HOME */}
              {activeTab === 'home' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
                  <header className="mb-8">
                    <h1 className="text-4xl font-black mb-2 flex justify-center items-center gap-3 drop-shadow-lg">
                      WeatherWise <Cloud className="text-sky-400 drop-shadow-md" />
                    </h1>
                    <p className="text-slate-200 text-sm font-medium drop-shadow-md">Smart recommendations for your day.</p>
                  </header>

                  {error && <div className="p-4 bg-red-500/80 backdrop-blur-md text-white font-bold rounded-xl border border-red-400/50 shadow-lg">{error}</div>}

                  {weather && (
                    <div className="space-y-4">
                      <section className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex justify-between items-center text-left">
                        <div>
                          <h2 className="text-3xl font-bold drop-shadow-lg">{weather.name}</h2>
                          <p className="text-sky-300 capitalize font-medium drop-shadow-md">{weather.weather[0].description}</p>
                        </div>
                        <div className="text-5xl font-black drop-shadow-xl">{Math.round(weather.main.temp)}°</div>
                      </section>

                      <section className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-lg flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-1 text-slate-300 mb-1">
                            <Thermometer size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feels Like</span>
                          </div>
                          <span className="text-2xl font-bold text-white drop-shadow-md">{Math.round(weather.main.feels_like)}°</span>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-lg flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-1 text-slate-300 mb-1">
                            <Wind size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Wind</span>
                          </div>
                          <span className="text-2xl font-bold text-white drop-shadow-md">
                            {Math.round(weather.wind.speed * 3.6)} <span className="text-sm font-normal text-slate-300">km/h</span>
                          </span>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-lg flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-1 text-slate-300 mb-1">
                            <Droplets size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Humidity</span>
                          </div>
                          <span className="text-2xl font-bold text-white drop-shadow-md">{weather.main.humidity}<span className="text-sm font-normal text-slate-300">%</span></span>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-lg flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-1 text-slate-300 mb-1">
                            <ArrowDownUp size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">High / Low</span>
                          </div>
                          <span className="text-2xl font-bold text-white drop-shadow-md">
                            {Math.round(weather.main.temp_max)}° <span className="text-slate-400 font-normal mx-0.5">/</span> {Math.round(weather.main.temp_min)}°
                          </span>
                        </div>
                      </section>

                      {forecast.length > 0 && (
                        <section className="mt-2 text-left">
                          <h3 className="flex items-center gap-2 font-bold mb-3 mt-6 text-slate-200 uppercase text-xs tracking-widest pl-2 drop-shadow-md">
                            <CalendarDays size={16} className="text-sky-300" /> Upcoming Days
                          </h3>
                          <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar">
                            {forecast.map((item, index) => (
                              <div key={index} className="min-w-[100px] bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-lg flex flex-col items-center justify-center gap-2 snap-center shrink-0">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                  {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-2xl font-black text-white drop-shadow-md">
                                  {Math.round(item.main.temp)}°
                                </span>
                                <span className="text-[10px] text-sky-300 font-medium capitalize text-center leading-tight">
                                  {item.weather[0].description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                  
                  {!weather && !error && (
                    <div className="text-slate-400 italic mt-12 text-sm drop-shadow-md">Getting your weather...</div>
                  )}
                </div>
              )}

              {/* SCREEN 2: CLOTHING - COMPLETELY REDESIGNED */}
              {activeTab === 'clothing' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left mt-4">
                  <h2 className="text-3xl font-black mb-6 flex items-center gap-3 justify-center text-center drop-shadow-md">
                    <Shirt className="text-sky-300" size={32} /> Wardrobe
                  </h2>
                  
                  {weather ? (
                    <div className="space-y-4">
                      {/* Context Banner */}
                      <div className="bg-sky-500/20 border border-sky-400/30 p-5 rounded-3xl mb-6 backdrop-blur-md shadow-lg text-center">
                        <p className="text-sky-100 text-sm font-medium leading-relaxed drop-shadow-md">
                          It feels like <span className="font-bold text-white">{Math.round(weather.main.feels_like)}°</span> with <span className="font-bold text-white capitalize">{weather.weather[0].description}</span> outside. Here is your tailored packing list:
                        </p>
                      </div>

                      {/* Render our smart categories */}
                      {Object.values(categorizeClothing(getClothingSuggestions(weather.main.temp, weather.weather[0].main))).map((category, index) => {
                        // Only render the category card if there are actually clothes in it!
                        if (category.items.length === 0) return null;
                        const Icon = category.icon;
                        
                        return (
                          <div key={index} className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg">
                            <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-200 uppercase text-xs tracking-widest drop-shadow-md">
                              <Icon size={16} className={category.color} /> {category.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {category.items.map((item, i) => (
                                <span key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-white/5 text-slate-200 rounded-full text-sm font-medium tracking-wide shadow-md">
                                  <span className="text-lg">{item.emoji}</span> {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-center mt-12 text-sm drop-shadow-md">Please search for a city first.</p>
                  )}
                </div>
              )}

              {/* SCREEN 3: ACTIVITIES */}
              {activeTab === 'activities' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left mt-4">
                  <h2 className="text-3xl font-black mb-6 flex items-center gap-3 justify-center text-center drop-shadow-md">
                    <MapPin className="text-emerald-400" size={32} /> Local Spots
                  </h2>
                  {weather ? (
                    <div className="space-y-4"> 
                      {fsqError ? (
                        <div className="text-xs text-orange-100 bg-orange-500/40 backdrop-blur-xl p-4 rounded-xl flex items-start gap-2 border border-orange-400/50 shadow-lg">
                          <AlertCircle size={14} className="shrink-0 mt-0.5 text-orange-300" />
                          <div><p className="font-bold mb-1 underline text-orange-200">API Notice:</p><p className="opacity-90">{fsqError}</p></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activities.length > 0 ? (
                            activities.map((place, index) => (
                              <LocationCard key={place.fsq_place_id || place.fsq_id || place.id || index} place={place} apiKey={FOURSQUARE_KEY} index={index} />
                            ))
                          ) : (
                            <p className="text-slate-400 text-sm italic text-center py-4 drop-shadow-md">Searching for local spots...</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-center mt-12 text-sm drop-shadow-md">Please search for a city first.</p>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Floating Action Button */}
      {!showCityList && (
        <button 
          onClick={() => setShowCityList(true)}
          className="fixed bottom-[13vh] right-6 p-4 bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:bg-slate-800 hover:scale-105 transition-all z-40 group"
        >
          <List size={24} className="text-sky-300 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 h-[10vh] min-h-[70px] bg-slate-900/60 backdrop-blur-xl border-t border-t-white/10 border-b-0 border-x-0 flex justify-around items-center px-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <button onClick={() => { setActiveTab('home'); setShowCityList(false); }} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'home' && !showCityList ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <Home size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </button>

        <button onClick={() => { setActiveTab('clothing'); setShowCityList(false); }} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'clothing' && !showCityList ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <Shirt size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Wear</span>
        </button>

        <button onClick={() => { setActiveTab('activities'); setShowCityList(false); }} className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'activities' && !showCityList ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <Footprints size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Go</span>
        </button>
      </nav>
    </>
  );
}

export default App;