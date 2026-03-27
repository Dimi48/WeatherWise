import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';

// Notice we added 'index' here!
function LocationCard({ place, apiKey, index = 0 }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsqId = place.fsq_place_id || place.fsq_id || place.id;
    
    if (!fsqId) {
      setLoading(false);
      return;
    }

    const fetchPhoto = async () => {
      try {
        const photoRes = await axios.get(
          `/foursquare/places/${fsqId}/photos`, 
          {
            params: { limit: 1 },
            headers: {
              Authorization: `Bearer ${apiKey}`,
              accept: 'application/json',
              'X-places-api-version': '2025-02-05'
            }
          }
        );

        if (photoRes.data && photoRes.data.length > 0) {
          const photo = photoRes.data[0];
          const compiledUrl = `${photo.prefix}400x400${photo.suffix}`;
          setPhotoUrl(compiledUrl);
        }
      } catch (err) {
        console.error(`Failed to fetch photo for ${place.name}:`, err);
      } finally {
        setLoading(false);
      }
    };

    // Card 0 waits 0ms, Card 1 waits 800ms, Card 2 waits 1600ms, etc.
    const staggerDelay = index * 800;
    const timer = setTimeout(() => {
      fetchPhoto();
    }, staggerDelay);

    return () => clearTimeout(timer);

  }, [place, apiKey, index]);

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-lg hover:border-sky-500/50 transition-all duration-300 group mb-4">
      {/* Photo Header */}
      <div className="h-40 w-full bg-slate-900 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : photoUrl ? (
          <img 
            src={photoUrl} 
            alt={place.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
            <MapPin size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-medium uppercase tracking-wider">No Photo</span>
          </div>
        )}
        
        {/* Category Badge overlay */}
        {place.categories && place.categories.length > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full z-10">
            {place.categories[0].name}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 relative z-20 bg-slate-800 text-left">
        <h3 className="font-bold text-slate-100 text-lg leading-tight mb-1 line-clamp-1">{place.name}</h3>
        <div className="flex items-start gap-1 text-slate-400">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <p className="text-sm line-clamp-2">
            {place.location?.formatted_address || place.location?.address || "Address hidden"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LocationCard;