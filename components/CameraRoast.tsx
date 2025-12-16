import React, { useRef, useState, useEffect } from 'react';
import { sendMessageToNeuna } from '../services/geminiService';

interface Props {
  isActive?: boolean;
  onSpeak: (text: string) => void;
}

const CameraRoast: React.FC<Props> = ({ isActive = true, onSpeak }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Effect to handle camera stream based on active state and facing mode
  useEffect(() => {
    if (isActive && !capturedImage && !result) {
       startCamera();
    } else if (!isActive && streamActive) {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isActive, facingMode, capturedImage]); // Re-run when facingMode changes

  const startCamera = async () => {
    stopCamera(); // Ensure previous stream is closed
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      // alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Flip horizontally if using front camera for mirror effect
        if (facingMode === 'user') {
            context.translate(canvasRef.current.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setLoading(true);
    
    // Convert Data URL to clean base64 for Gemini
    const cleanBase64 = capturedImage.split(',')[1];
    
    // Custom instruction for Smart Camera Mode
    const smartCameraInstruction = `
      You are Neuna's Smart Vision.
      
      Analyze the image:
      
      1. **Math/Text**: If you see a math problem, solve it step-by-step seriously. If you see text, translate or summarize it.
      2. **Objects/People/Scenes**: If it's a general photo, provide "Positive Criticism". 
         - Describe what you see.
         - Make a witty, sophisticated observation or a playful roast about it.
         - Offer one piece of constructive advice if applicable (e.g., "Great outfit, but maybe iron that shirt next time.").
         
      Maintain the "Positive Roast" persona for non-math tasks.
    `;

    const response = await sendMessageToNeuna(
      "Analyze this image.",
      [],
      { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
      undefined,
      undefined,
      smartCameraInstruction // Pass the custom instruction
    );

    setResult(response.text);
    
    // Speak the result using global handler
    if (response.text) {
        onSpeak(response.text);
    }

    setLoading(false);
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    window.speechSynthesis.cancel();
    // Camera will auto-start due to useEffect dependency on capturedImage being null
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6 overflow-y-auto custom-scrollbar">
      <div className="shrink-0">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent mb-2">
            Smart Vision
        </h2>
        <p className="text-gray-400">Math Solver & Object Analyzer (with a bit of sass)</p>
      </div>
      
      <div className="relative w-full max-w-2xl aspect-video glass-card rounded-3xl overflow-hidden border border-gray-700 shadow-2xl shrink-0 bg-black group">
        {/* Viewport content */}
        {!capturedImage && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`w-full h-full object-cover ${!streamActive ? 'hidden' : ''} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
          />
        )}
        
        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}

        {!streamActive && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <button 
              onClick={startCamera}
              className="px-8 py-3 bg-white text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* Camera Switch Button (Only visible when active and not captured) */}
        {streamActive && !capturedImage && (
            <button 
                onClick={toggleCamera}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-20"
                title="Switch Camera"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </button>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex space-x-4 shrink-0">
        {streamActive && (
          <button 
            onClick={captureImage}
            className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          >
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </button>
        )}
        
        {capturedImage && !result && !loading && (
          <>
            <button onClick={reset} className="px-6 py-2 text-gray-300 hover:text-white font-medium">
              Retake
            </button>
            <button 
              onClick={analyzeImage}
              className="px-6 py-2 bg-brand-primary text-white font-bold rounded-full shadow-lg hover:bg-brand-secondary transition-colors"
            >
              Analyze
            </button>
          </>
        )}

        {loading && (
          <div className="flex items-center space-x-2 text-brand-primary">
            <span className="animate-pulse font-semibold">Analyzing...</span>
          </div>
        )}
      </div>

      {result && (
        <div className="w-full max-w-3xl p-6 glass-card rounded-2xl text-left animate-fade-in shrink-0 mb-4">
          <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap">{result}</p>
          <div className="mt-4 flex justify-end">
            <button onClick={reset} className="text-sm text-brand-accent hover:text-white font-semibold transition-colors">
               Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraRoast;