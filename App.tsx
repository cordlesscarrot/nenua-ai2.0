import React, { useState, useEffect, useRef } from 'react';
import { SmartDevice, ChatMessage, MessageRole, AppMode } from './types';
import { INITIAL_DEVICES } from './constants';
import { sendMessageToNeuna } from './services/geminiService';
import WeatherPanel from './components/WeatherPanel';
import CameraRoast from './components/CameraRoast';
import NotesGenerator from './components/NotesGenerator';
import SettingsModal, { SpeechSettings } from './components/SettingsModal';

// Modern Icons
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 013 3v1.5a3 3 0 01-6 0V4.5a3 3 0 013-3z" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// Using a reliable CDN for a futuristic abstract logo
const LOGO_URL = "https://i.ibb.co/9BfMpmj/Gemini-Generated-Image-tp54pltp54pltp54.png";

// --- Formatted Text Component ---
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');

  const renderInline = (lineContent: string) => {
    // 1. Split by Bold (**...**)
    const parts = lineContent.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
      // Bold Text
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={i} className="font-bold text-brand-secondary">{part.slice(2, -2)}</strong>;
      }
      
      // 2. Split by Italic (*...*) inside non-bold parts
      const italicParts = part.split(/(\*[^*]+?\*)/g);
      return (
        <React.Fragment key={i}>
          {italicParts.map((subPart, j) => {
             if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length >= 3) {
               return <em key={j} className="italic text-brand-accent">{subPart.slice(1, -1)}</em>;
             }
             return subPart;
          })}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-1 text-sm md:text-base leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        // Handle Bullet Points
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start ml-2 space-x-2">
               <span className="text-brand-primary mt-1.5 text-[10px]">●</span>
               <span>{renderInline(trimmed.substring(2))}</span>
            </div>
          );
        }

        // Handle Numbered Lists
        if (/^\d+\.\s/.test(trimmed)) {
           const match = trimmed.match(/^(\d+)\.\s(.*)/);
           if (match) {
             return (
               <div key={i} className="flex items-start ml-2 space-x-2">
                 <span className="text-brand-primary font-bold text-xs mt-0.5">{match[1]}.</span>
                 <span>{renderInline(match[2])}</span>
               </div>
             )
           }
        }

        if (!trimmed) return <div key={i} className="h-2" />;

        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

const App: React.FC = () => {
  // --- State ---
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [devices, setDevices] = useState<SmartDevice[]>([...INITIAL_DEVICES]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Settings State
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>({
    voiceURI: null,
    rate: 1.1,
    pitch: 0.9,
    volume: 1.0
  });

  // --- Persistence Effects ---
  useEffect(() => {
    // Load chats and settings
    try {
      const savedMessages = localStorage.getItem('neuna_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      
      const savedSettings = localStorage.getItem('neuna_settings');
      if (savedSettings) {
        setSpeechSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  useEffect(() => {
    // Save chats
    localStorage.setItem('neuna_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Save settings
    localStorage.setItem('neuna_settings', JSON.stringify(speechSettings));
  }, [speechSettings]);

  useEffect(() => {
    // Only scroll if Chat mode is active
    if (mode === AppMode.CHAT) {
      scrollToBottom();
    }
  }, [messages, mode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Logic Helpers ---

  const addMessage = (role: MessageRole, text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleSmartHomeTool = async (functionCall: any) => {
    const { name, args } = functionCall;
    
    if (name === "setLightState") {
      const { deviceName, state } = args;
      setDevices(prev => prev.map(d => {
        if (d.name.toLowerCase().includes(deviceName.toLowerCase()) || d.room.toLowerCase().includes(deviceName.toLowerCase())) {
          return { ...d, status: state };
        }
        return d;
      }));
      return { success: true, message: `Device ${deviceName} set to ${state ? 'ON' : 'OFF'}` };
    }
    
    if (name === "setThermostat") {
       const { temperature } = args;
       setDevices(prev => prev.map(d => d.type === 'thermostat' ? { ...d, value: temperature } : d));
       return { success: true, message: `Thermostat set to ${temperature}` };
    }

    return { success: false, message: "Device not found." };
  };

  const speakText = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      if (speechSettings.voiceURI) {
        const selected = voices.find(v => v.voiceURI === speechSettings.voiceURI);
        if (selected) utterance.voice = selected;
      }

      utterance.rate = speechSettings.rate;
      utterance.pitch = speechSettings.pitch;
      utterance.volume = speechSettings.volume;

      window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (audioBlob?: Blob) => {
    if ((!input.trim() && !audioBlob) || isProcessing) return;
    
    setIsProcessing(true);
    let userInput = input;
    
    if (audioBlob) {
        userInput = "🎤 Audio Message Sent";
    }
    
    setInput('');
    addMessage(MessageRole.USER, userInput);

    let audioPart = undefined;
    if (audioBlob) {
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        await new Promise<void>((resolve) => {
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // Remove data URL prefix (e.g. "data:audio/wav;base64,")
                const cleanBase64 = base64data.split(',')[1];
                audioPart = { 
                    inlineData: { 
                        data: cleanBase64, 
                        mimeType: audioBlob.type || 'audio/webm'
                    } 
                };
                resolve();
            }
        });
    }

    // Call API with either text or audio
    // We pass 'null' as text if it's audio-only
    const response = await sendMessageToNeuna(
        audioBlob ? null : userInput, 
        messages, 
        undefined, 
        audioPart,
        handleSmartHomeTool,
        undefined
    );
    
    addMessage(MessageRole.MODEL, response.text || "...");
    
    // If input was audio, output audio (TTS)
    if (audioBlob && response.text) {
        speakText(response.text);
    }
    
    setIsProcessing(false);
  };

  // --- Voice Recording Logic ---

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            handleSend(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const clearChat = () => {
      if(window.confirm("Are you sure you want to clear the chat history?")) {
          setMessages([]);
          localStorage.removeItem('neuna_messages');
      }
  };

  return (
    // Main container uses 100dvh (Dynamic Viewport Height) for mobile browser support
    <div className="flex w-screen h-[100dvh] overflow-hidden bg-brand-dark text-white font-sans">
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={speechSettings}
        onSave={setSpeechSettings}
      />

      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-surface border-r border-gray-800 z-20 h-full">
        <div className="p-6 flex items-center space-x-3 shrink-0">
          <img 
            src={LOGO_URL} 
            alt="Neuna Logo" 
            className="w-10 h-10 rounded-full border border-gray-600 shadow-lg shadow-brand-primary/20 object-cover bg-brand-dark"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=N+2&background=6366f1&color=fff";
            }}
          />
          <h1 className="text-2xl font-extrabold gradient-text tracking-tight">Neuna 2.0</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setMode(AppMode.CHAT)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${mode === AppMode.CHAT ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            Roast Chat
          </button>
          <button 
             onClick={() => setMode(AppMode.ROAST)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${mode === AppMode.ROAST ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            Smart Camera
          </button>
          <button 
             onClick={() => setMode(AppMode.NOTES)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${mode === AppMode.NOTES ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            Notes & AI
          </button>
          
          <button 
             onClick={() => setMode(AppMode.WEATHER)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium lg:hidden ${mode === AppMode.WEATHER ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            Weather
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-gray-800 shrink-0">
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-full flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl transition-all mb-2"
           >
              <CogIcon />
              <span className="font-medium">Settings</span>
           </button>
           
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-secondary to-brand-accent flex items-center justify-center font-bold">
                    L
                </div>
                <span className="text-sm font-semibold truncate" title="LilBroTryingToGetHelp">LilBroTryingToGetHelp</span>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-brand-dark">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-brand-surface/80 backdrop-blur z-30 shrink-0 border-b border-gray-800">
           <div className="flex items-center space-x-3">
             <img 
               src={LOGO_URL} 
               alt="Neuna Logo" 
               className="w-8 h-8 rounded-full border border-gray-600 object-cover bg-brand-dark"
               onError={(e) => {
                (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=N+2&background=6366f1&color=fff";
               }}
             />
             <h1 className="text-xl font-bold gradient-text">Neuna 2.0</h1>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2">
             <MenuIcon />
           </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-50 bg-brand-dark/95 backdrop-blur-md flex flex-col p-8 space-y-6 md:hidden animate-fade-in">
             <button onClick={() => { setMode(AppMode.CHAT); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white text-left p-2 border-b border-gray-800">Roast Chat</button>
             <button onClick={() => { setMode(AppMode.ROAST); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white text-left p-2 border-b border-gray-800">Smart Camera</button>
             <button onClick={() => { setMode(AppMode.NOTES); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white text-left p-2 border-b border-gray-800">Notes & AI</button>
             <button onClick={() => { setMode(AppMode.WEATHER); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white text-left p-2 border-b border-gray-800">Weather</button>
             <button onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white text-left p-2 border-b border-gray-800 flex items-center gap-2"><CogIcon /> Settings</button>
             <button onClick={() => setIsSidebarOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-800 rounded-full text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        )}

        {/* --- Content Area Container --- */}
        <div className="flex-1 relative w-full h-full overflow-hidden">
          
          {/* CHAT VIEW */}
          <div className={`absolute inset-0 flex flex-col h-full ${mode === AppMode.CHAT ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 mt-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 mb-4 rounded-3xl overflow-hidden shadow-2xl shadow-brand-primary/30 border border-gray-700">
                      <img 
                        src={LOGO_URL} 
                        alt="Logo" 
                        className="w-full h-full object-cover bg-brand-dark" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=N+2&background=6366f1&color=fff";
                        }}
                      />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Neuna is awake.</h2>
                  <p className="text-gray-400">Ready to chat (and judge you politely).</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl text-sm md:text-base shadow-sm
                    ${msg.role === MessageRole.USER 
                      ? 'bg-brand-primary text-white rounded-br-none' 
                      : 'bg-brand-surface text-gray-200 rounded-bl-none border border-gray-700'}
                  `}>
                    <FormattedText text={msg.text} />
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-brand-surface border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Trash / Clear Button */}
            {messages.length > 0 && (
                <button 
                    onClick={clearChat}
                    className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full hover:bg-red-500/80 transition-colors text-gray-400 hover:text-white"
                    title="Clear Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            )}

            <div className="p-3 md:p-6 bg-brand-dark/95 backdrop-blur shrink-0 border-t border-gray-800">
              <div className="max-w-4xl mx-auto relative bg-brand-surface rounded-full flex items-center p-2 pr-2 border border-gray-700 shadow-xl">
                <button 
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`p-2 md:p-3 rounded-full mr-1 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  {isRecording ? <StopIcon /> : <MicIcon />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Listening..." : "Roast me..."}
                  disabled={isRecording}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-medium text-sm md:text-base disabled:opacity-50"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !isRecording) || isProcessing}
                  className="p-2 bg-white text-black rounded-full hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>

          {/* ROAST VIEW */}
          <div className={`absolute inset-0 h-full overflow-hidden ${mode === AppMode.ROAST ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
             <CameraRoast isActive={mode === AppMode.ROAST} onSpeak={speakText} />
          </div>

          {/* NOTES VIEW */}
          <div className={`absolute inset-0 h-full overflow-hidden ${mode === AppMode.NOTES ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
             <NotesGenerator />
          </div>

          {/* WEATHER VIEW (Mobile Only) */}
          <div className={`absolute inset-0 h-full overflow-hidden ${mode === AppMode.WEATHER ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
             <div className="h-full p-4 max-w-2xl mx-auto overflow-hidden flex flex-col">
               <WeatherPanel />
             </div>
          </div>

        </div>
      </main>

      {/* --- Right Panel (Desktop) --- */}
      <aside className="hidden lg:block w-96 bg-brand-surface/30 border-l border-gray-800 backdrop-blur-md h-full shrink-0">
         <div className="h-full w-full p-6 flex flex-col overflow-hidden">
           <WeatherPanel />
         </div>
      </aside>

    </div>
  );
};

export default App;