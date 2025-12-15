import React from 'react';
import { SmartDevice } from '../types';

interface Props {
  devices: SmartDevice[];
  toggleDevice: (id: string) => void;
  updateDeviceValue: (id: string, value: number) => void;
}

const SmartHomePanel: React.FC<Props> = ({ devices, toggleDevice, updateDeviceValue }) => {
  return (
    <div className="h-full overflow-y-auto pb-20 scrollbar-hide">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          Control Center
        </h2>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {devices.map(device => {
          const isActive = device.status === true || device.status === 'active';
          
          return (
            <div 
              key={device.id}
              className={`
                relative overflow-hidden p-5 rounded-2xl transition-all duration-300
                glass-card group
                ${isActive ? 'border-brand-primary/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-gray-800 opacity-80'}
              `}
            >
              {/* Background gradient hint */}
              <div className={`absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300
                    ${isActive ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-500'}
                  `}>
                      {device.type === 'light' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                      {device.type === 'thermostat' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                      {device.type === 'lock' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  </div>
                  
                  {/* Toggle Switch for Boolean Devices */}
                  {(device.type === 'light' || device.type === 'lock') && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleDevice(device.id); }}
                      className={`
                        w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none
                        ${isActive ? 'bg-green-500' : 'bg-gray-700'}
                      `}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-white font-bold text-lg">{device.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400 font-medium tracking-wide">{device.room}</p>
                    <span className={`text-xs font-bold ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
                      {device.type === 'thermostat' 
                        ? `${device.value}°F` 
                        : (device.type === 'lock' ? (device.status ? 'LOCKED' : 'UNLOCKED') : (device.status ? 'ON' : 'OFF'))
                      }
                    </span>
                  </div>
                </div>

                {/* Thermostat Controls */}
                {device.type === 'thermostat' && typeof device.value === 'number' && (
                  <div className="mt-5 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => updateDeviceValue(device.id, (device.value || 72) - 1)}
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-brand-primary text-white flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <div className="flex-1">
                        <input 
                           type="range" 
                           min="60" 
                           max="90" 
                           value={device.value} 
                           onChange={(e) => updateDeviceValue(device.id, parseInt(e.target.value))}
                           className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                      <button 
                        onClick={() => updateDeviceValue(device.id, (device.value || 72) + 1)}
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-brand-primary text-white flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartHomePanel;