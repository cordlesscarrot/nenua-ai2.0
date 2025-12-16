import React, { useState, useEffect } from 'react';
import { fetchWeather } from '../services/geminiService';

interface WeatherData {
  location: string;
  countryCode?: string;
  tempC?: number | string;
  tempF?: number | string;
  temperature?: string; // Fallback
  condition: string;
  humidity: string;
  windSpeed: string;
  coordinates: string;
  forecast: string;
}

const WeatherPanel: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');

  const checkPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(result.state);
      result.onchange = () => setPermissionStatus(result.state);
    } catch (e) {
      setPermissionStatus('unknown');
    }
  };

  const getWeatherData = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setPermissionStatus('granted');
          const { latitude, longitude } = position.coords;
          const result = await fetchWeather(latitude, longitude);
          
          if (result.data) {
            setWeatherData(result.data);
          } else {
            // Fallback if JSON parsing failed
            setError("Could not parse weather data format.");
          }
          setSources(result.sources as string[]);
        } catch (err) {
          setError("Failed to fetch weather data from AI service.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionStatus('denied');
          setError("Location access denied.");
        } else {
          setError("Unable to retrieve location.");
        }
      }
    );
  };

  useEffect(() => {
    checkPermission();
    navigator.geolocation.getCurrentPosition(
      () => getWeatherData(), 
      () => {} 
    );
    
    const interval = setInterval(() => {
        if (!error && weatherData) {
            getWeatherData();
        }
    }, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const renderTemperature = () => {
    if (!weatherData) return null;

    if (weatherData.tempC !== undefined && weatherData.tempF !== undefined) {
      const isUS = weatherData.countryCode === 'US' || weatherData.countryCode === 'USA';
      
      if (isUS) {
        return (
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-bold text-white tracking-tighter">{weatherData.tempF}°F</span>
            <span className="text-xl text-gray-400">({weatherData.tempC}°C)</span>
          </div>
        );
      } else {
        return (
           <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-bold text-white tracking-tighter">{weatherData.tempC}°C</span>
            <span className="text-xl text-gray-400">({weatherData.tempF}°F)</span>
          </div>
        );
      }
    }
    
    // Fallback
    return <span className="text-5xl md:text-6xl font-bold text-white tracking-tighter">{weatherData.temperature}</span>;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
        <h2 className="text-brand-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
          Live Dashboard
        </h2>
        <button 
          onClick={getWeatherData} 
          disabled={loading}
          className={`p-1.5 rounded-full hover:bg-gray-700 transition-colors ${loading ? 'animate-spin' : ''}`}
          title="Refresh"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
        
        {/* Permission / Empty State */}
        {!weatherData && !loading && (
          <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 p-4 glass-card rounded-2xl border border-gray-700">
             <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
             <p className="text-sm text-gray-400">{error ? error : "Location access needed."}</p>
             <button 
               onClick={getWeatherData}
               className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
             >
               {permissionStatus === 'denied' ? 'Retry Permission' : 'Enable Location'}
             </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !weatherData && (
           <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-gray-800/50 rounded-2xl"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-800/50 rounded-2xl"></div>
                <div className="h-24 bg-gray-800/50 rounded-2xl"></div>
              </div>
           </div>
        )}

        {/* Structured Data Display */}
        {weatherData && (
          <div className="space-y-4 animate-fade-in">
             
             {/* Main Card: Location & Temp */}
             <div className="glass-card p-6 rounded-3xl border border-gray-700/50 bg-gradient-to-br from-brand-surface to-brand-dark shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{weatherData.location}</h3>
                  <div className="flex items-center">
                    {renderTemperature()}
                  </div>
                  <p className="text-brand-accent font-medium mt-2 flex items-center gap-2">
                    {weatherData.condition}
                  </p>
                </div>
             </div>

             {/* Grid Stats */}
             <div className="grid grid-cols-2 gap-3">
               {/* Humidity */}
               <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700 flex flex-col justify-center">
                  <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Humidity
                  </div>
                  <div className="text-xl font-bold text-blue-200">{weatherData.humidity}</div>
               </div>

               {/* Wind */}
               <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700 flex flex-col justify-center">
                  <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Wind
                  </div>
                  <div className="text-xl font-bold text-green-200">{weatherData.windSpeed}</div>
               </div>
               
               {/* Coordinates */}
               <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700 flex flex-col justify-center col-span-2">
                  <div className="text-gray-400 text-xs mb-1">Coordinates</div>
                  <div className="text-sm font-mono text-gray-300">{weatherData.coordinates}</div>
               </div>
             </div>

             {/* Forecast */}
             <div className="bg-brand-surface/60 p-5 rounded-2xl border border-gray-700">
               <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Today's Forecast</h4>
               <p className="text-sm text-gray-200 leading-relaxed">
                 {weatherData.forecast}
               </p>
             </div>

             {/* Sources */}
             {sources.length > 0 && (
               <div className="mt-2">
                 <div className="flex flex-wrap gap-2">
                   {sources.map((url, idx) => (
                     <a 
                       key={idx} 
                       href={url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-[10px] text-gray-500 hover:text-brand-primary transition-colors underline decoration-dotted"
                     >
                       {new URL(url).hostname.replace('www.', '')}
                     </a>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherPanel;