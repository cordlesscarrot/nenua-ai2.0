import React, { useState, useEffect } from 'react';

export interface SpeechSettings {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: SpeechSettings;
  onSave: (settings: SpeechSettings) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [localSettings, setLocalSettings] = useState<SpeechSettings>(settings);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setAllVoices(available);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Filter voices - Default to English
  useEffect(() => {
    // Match based on 'en' (English)
    const filtered = allVoices.filter(v => v.lang.startsWith('en'));
    setFilteredVoices(filtered);

    // If current voice is not in the new filtered list (and we have voices), switch to the first one
    if (filtered.length > 0) {
       const currentVoiceExists = filtered.find(v => v.voiceURI === localSettings.voiceURI);
       if (!currentVoiceExists) {
         setLocalSettings(prev => ({ ...prev, voiceURI: filtered[0].voiceURI }));
       }
    }
  }, [allVoices]);

  useEffect(() => {
     setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleChange = (key: keyof SpeechSettings, value: string | number) => {
     const newSettings = { ...localSettings, [key]: value };
     setLocalSettings(newSettings);
     onSave(newSettings); // Auto-save for immediate feedback
  };

  const handleTest = () => {
     window.speechSynthesis.cancel();
     const utterance = new SpeechSynthesisUtterance("System audio check initiated.");
     
     const selectedVoice = allVoices.find(v => v.voiceURI === localSettings.voiceURI);
     if (selectedVoice) {
         utterance.voice = selectedVoice;
     }
     
     utterance.rate = localSettings.rate;
     utterance.pitch = localSettings.pitch;
     utterance.volume = localSettings.volume;
     window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-brand-surface border border-gray-700 rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-brand-secondary"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
           System Settings
        </h2>

        <div className="space-y-6">
          
          {/* Voice Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Voice Profile (English)</label>
            <div className="relative">
                <select 
                value={localSettings.voiceURI || ''}
                onChange={(e) => handleChange('voiceURI', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white focus:border-brand-primary outline-none"
                >
                {filteredVoices.length === 0 && (
                    <option value="">No English voices found</option>
                )}
                {filteredVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                    </option>
                ))}
                </select>
            </div>
            <p className="text-xs text-gray-500">
                Choose a specific voice. Voice names often indicate gender.
            </p>
          </div>

          {/* Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <label className="text-gray-300">Speed</label>
                <span className="text-brand-primary">{localSettings.rate}x</span>
            </div>
            <input 
              type="range" min="0.5" max="2" step="0.1"
              value={localSettings.rate}
              onChange={(e) => handleChange('rate', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <label className="text-gray-300">Pitch</label>
                <span className="text-brand-secondary">{localSettings.pitch}</span>
            </div>
            <input 
              type="range" min="0.5" max="2" step="0.1"
              value={localSettings.pitch}
              onChange={(e) => handleChange('pitch', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
            />
          </div>
          
           {/* Volume */}
           <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <label className="text-gray-300">Volume</label>
                <span className="text-brand-accent">{Math.round(localSettings.volume * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1"
              value={localSettings.volume}
              onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between">
           <button 
             onClick={handleTest}
             className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
           >
             Test Audio
           </button>
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
           >
             Save & Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;