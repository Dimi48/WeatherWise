import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';

function LocationCard({ place, apiKey, index = 0 }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Smart trick: Creates a different colored gradient fallback based on the card's position
  const fallbackGradients = [
    'from-sky-500/40 to-indigo-500/40',
    'from-emerald-500/40 to-teal-500/40',
    'from-blue-500/40 to-purple-500/40',
    'from-cyan-500/40 to-sky-500/40'
  ];
  const activeGradient = fallbackGradients[index % fallbackGradients.length];

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

    const staggerDelay = index * 800;
    const timer = setTimeout(() => {
      fetchPhoto();
    }, staggerDelay);

    return () => clearTimeout(timer);

  }, [place, apiKey, index]);

  return (
    // Upgraded to Glassmorphism to match the rest of the app
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-lg hover:border-sky-400/50 transition-all duration-300 group mb-4">
      {/* Photo Header */}
      <div className="h-40 w-full bg-slate-900/50 relative overflow-hidden">
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
          // The beautiful intentional fallback gradient
          <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${activeGradient} text-sky-100`}>
            <MapPin size={32} className="mb-2 opacity-70 drop-shadow-md" />
            <span className="font-heading text-xs font-bold uppercase tracking-widest drop-shadow-md opacity-90">Local Spot</span>
          </div>
        )}
        
        {/* Category Badge overlay */}
        {place.categories && place.categories.length > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-slate-950/60 backdrop-blur-md text-white text-[10px] font-heading font-bold uppercase tracking-wider rounded-full border border-white/10 z-10 shadow-lg">
            {place.categories[0].name}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 relative z-20 text-left">
        {/* Added Poppins to the title */}
        <h3 className="font-heading font-bold text-slate-100 text-xl leading-tight mb-1.5 line-clamp-1 drop-shadow-md">{place.name}</h3>
        <div className="flex items-start gap-1.5 text-slate-300 font-medium">
          <MapPin size={16} className="shrink-0 mt-0.5 text-emerald-400" />
          <p className="text-sm line-clamp-2">
            {place.location?.formatted_address || place.location?.address || "Address hidden"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LocationCard;