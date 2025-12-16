import React, { useState, useRef } from 'react';
import { generateStudyNotes } from '../services/geminiService';

const NotesGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [notesHtml, setNotesHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setNotesHtml(null);
    
    const html = await generateStudyNotes(topic);
    setNotesHtml(html);
    setIsLoading(false);
  };

  const downloadPDF = () => {
    if (!printRef.current) return;
    
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    if (printWindow) {
      printWindow.document.write('<html><head><title>Neuna Notes - ' + topic + '</title>');
      printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      printWindow.document.write(`
        <style>
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              padding: 40px; 
              color: black;
            }
            /* Hide non-print elements if any leak in */
            .no-print { display: none !important; }
            /* Force dark mode styles to light for paper */
            .bg-transparent { background-color: white !important; }
            .text-gray-200 { color: black !important; }
          }
          body { background-color: white; color: black; padding: 20px; font-family: sans-serif; }
        </style>
      `); 
      printWindow.document.write('</head><body>');
      printWindow.document.write(content);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      // Delay slightly to ensure Tailwind loads
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 animate-fade-in max-w-5xl mx-auto w-full overflow-hidden">
      <div className="mb-4 md:mb-8 text-center shrink-0">
        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-accent mb-2">
          Neuna Notes
        </h2>
        <p className="text-gray-400 text-sm md:text-base">Describe a topic, and I'll generate comprehensive study material.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-8 shrink-0">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic (e.g., 'React Hooks')..."
          className="flex-1 bg-brand-surface border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-brand-primary focus:outline-none transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !topic.trim()}
          className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </>
          ) : (
            'Generate'
          )}
        </button>
      </div>

      {notesHtml && (
        <div className="flex-1 overflow-hidden flex flex-col glass-card rounded-2xl border border-gray-700 min-h-0">
           {/* Toolbar */}
           <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-brand-surface/50 shrink-0">
             <div className="flex space-x-2">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
             </div>
             <div className="flex space-x-3">
               <button onClick={downloadPDF} className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                 </svg>
                 Save as PDF
               </button>
             </div>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-brand-dark/30">
             <div 
               ref={printRef}
               className="prose prose-invert prose-sm md:prose-lg max-w-none 
                          prose-headings:font-bold prose-h1:text-brand-primary prose-h2:text-brand-secondary 
                          prose-strong:text-brand-accent prose-code:text-pink-300
                          [&_div]:border-gray-600" 
               dangerouslySetInnerHTML={{ __html: notesHtml }} 
             />
           </div>
        </div>
      )}
    </div>
  );
};

export default NotesGenerator;