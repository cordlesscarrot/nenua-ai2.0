import React, { useState, useEffect, useRef } from 'react';
import { SmartDevice, ChatMessage, MessageRole, AppMode } from './types';
import { INITIAL_DEVICES } from './constants';
import { sendMessageToNeuna } from './services/geminiService';
import SmartHomePanel from './components/SmartHomePanel';
import CameraRoast from './components/CameraRoast';

// Modern Icons
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 013 3v1.5a3 3 0 01-6 0V4.5a3 3 0 013-3z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;

// Using a reliable CDN for a futuristic abstract logo
const LOGO_URL = "https://i.ibb.co/9BfMpmj/Gemini-Generated-Image-tp54pltp54pltp54.png";

const App: React.FC = () => {
  // --- State ---
  // No user state needed anymore
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [devices, setDevices] = useState<SmartDevice[]>([...INITIAL_DEVICES]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const userInput = input;
    setInput('');
    addMessage(MessageRole.USER, userInput);
    setIsProcessing(true);

    // Call API
    const response = await sendMessageToNeuna(userInput, messages, undefined, handleSmartHomeTool);
    addMessage(MessageRole.MODEL, response.text || "...");
    
    setIsProcessing(false);
  };

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: !d.status };
      }
      return d;
    }));
  };

  const updateDeviceValue = (id: string, value: number) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, value: value };
      }
      return d;
    }));
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Browser doesn't support voice.");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-dark text-white font-sans">
      
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-surface border-r border-gray-800 z-20">
        <div className="p-6 flex items-center space-x-3">
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
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setMode(AppMode.CHAT)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${mode === AppMode.CHAT ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            Chat
          </button>
          <button 
             onClick={() => setMode(AppMode.ROAST)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${mode === AppMode.ROAST ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            Roast Camera
          </button>
          <button 
             onClick={() => setMode(AppMode.DASHBOARD)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${mode === AppMode.DASHBOARD ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            Smart Home
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-secondary to-brand-accent flex items-center justify-center font-bold">
                    A
                </div>
                <span className="text-sm font-semibold">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-brand-dark">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-brand-surface/80 backdrop-blur z-30 sticky top-0">
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
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white">
             <MenuIcon />
           </button>
        </header>

        {/* Mobile Menu */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-50 bg-brand-dark flex flex-col p-8 space-y-6 md:hidden animate-fade-in">
             <button onClick={() => { setMode(AppMode.CHAT); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white">Chat</button>
             <button onClick={() => { setMode(AppMode.ROAST); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white">Roast Camera</button>
             <button onClick={() => { setMode(AppMode.DASHBOARD); setIsSidebarOpen(false); }} className="text-2xl font-bold text-white">Smart Home</button>
             <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500">Close</button>
          </div>
        )}

        {/* --- Content Area --- */}
        <div className="flex-1 overflow-hidden relative flex">
          
          <div className={`flex-1 flex flex-col relative ${mode !== AppMode.CHAT ? 'h-full' : ''}`}>
             
             {/* CHAT MODE */}
             {mode === AppMode.CHAT && (
               <>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                      <div className="w-24 h-24 mb-4 rounded-3xl overflow-hidden shadow-2xl shadow-brand-primary/30 border border-gray-700">
                          <img 
                            src={LOGO_URL} 
                            alt="Logo" 
                            className="w-full h-full object-cover bg-brand-dark" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=N+2&background=6366f1&color=fff";
                            }}
                          />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Ready when you are.</h2>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`
                        max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm md:text-base shadow-sm
                        ${msg.role === MessageRole.USER 
                          ? 'bg-brand-primary text-white rounded-br-none' 
                          : 'bg-brand-surface text-gray-200 rounded-bl-none border border-gray-700'}
                      `}>
                        <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
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

                <div className="p-4 md:p-6 bg-brand-dark/95 backdrop-blur">
                  <div className="max-w-4xl mx-auto relative bg-brand-surface rounded-full flex items-center p-2 pr-4 border border-gray-700 shadow-xl">
                    <button 
                      onClick={handleVoiceInput}
                      className={`p-3 rounded-full mr-2 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      <MicIcon />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Say something for me to roast..."
                      className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-medium"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isProcessing}
                      className="p-2 bg-white text-black rounded-full hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
               </>
             )}

             {/* ROAST MODE */}
             {mode === AppMode.ROAST && <CameraRoast />}

             {/* DASHBOARD MODE (Mobile Only View) */}
             {mode === AppMode.DASHBOARD && (
               <div className="h-full p-4 max-w-2xl mx-auto">
                 <SmartHomePanel 
                   devices={devices} 
                   toggleDevice={toggleDevice} 
                   updateDeviceValue={updateDeviceValue} 
                 />
               </div>
             )}
          </div>

          {/* Right Panel Smart Home (Desktop) */}
          <aside className="hidden lg:block w-96 bg-brand-surface/30 border-l border-gray-800 backdrop-blur-md overflow-hidden">
             {/* The padding is now inside the component or wrapper to allow full height scroll */}
             <div className="h-full w-full p-6">
               <SmartHomePanel 
                 devices={devices} 
                 toggleDevice={toggleDevice} 
                 updateDeviceValue={updateDeviceValue}
               />
             </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default App;