import React, { useRef, useState } from 'react';
import { sendMessageToNeuna } from '../services/geminiService';

const CameraRoast: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [roastResult, setRoastResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Unable to access camera. Please check permissions.");
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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const generateRoast = async () => {
    if (!capturedImage) return;
    setLoading(true);
    
    // Convert Data URL to clean base64 for Gemini
    const cleanBase64 = capturedImage.split(',')[1];
    
    const response = await sendMessageToNeuna(
      "Look at this image. Roast it hard. Then tell me what it is and a fun fact.",
      [],
      { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } }
    );

    setRoastResult(response.text);
    setLoading(false);
  };

  const reset = () => {
    setCapturedImage(null);
    setRoastResult(null);
    startCamera();
  };

  React.useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent mb-2">
            Roast My Pic
        </h2>
        <p className="text-gray-400">Show me something, and I'll tell you why it's awful.</p>
      </div>
      
      <div className="relative w-full max-w-2xl aspect-video glass-card rounded-3xl overflow-hidden border border-gray-700 shadow-2xl">
        {/* Viewport content */}
        {!capturedImage && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover ${!streamActive ? 'hidden' : ''}`} 
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
              Open Camera
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex space-x-4">
        {streamActive && (
          <button 
            onClick={captureImage}
            className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
          />
        )}
        
        {capturedImage && !roastResult && !loading && (
          <>
            <button onClick={reset} className="px-6 py-2 text-gray-300 hover:text-white font-medium">
              Retake
            </button>
            <button 
              onClick={generateRoast}
              className="px-6 py-2 bg-brand-primary text-white font-bold rounded-full shadow-lg hover:bg-brand-secondary transition-colors"
            >
              Roast It
            </button>
          </>
        )}

        {loading && (
          <div className="flex items-center space-x-2 text-brand-primary">
            <span className="animate-pulse font-semibold">Generating roast...</span>
          </div>
        )}
      </div>

      {roastResult && (
        <div className="w-full max-w-3xl p-6 glass-card rounded-2xl text-left animate-fade-in">
          <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap">{roastResult}</p>
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