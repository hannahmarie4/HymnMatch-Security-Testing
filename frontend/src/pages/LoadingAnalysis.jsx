import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiLoader } from 'react-icons/fi';

export default function LoadingAnalysis() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate the steps purely for UX
    const timer1 = setTimeout(() => setStep(1), 1000); // Extracting text
    const timer2 = setTimeout(() => setStep(2), 2500); // Analyzing themes
    const timer3 = setTimeout(() => setStep(3), 4000); // Matching hymns
    const timer4 = setTimeout(() => setStep(4), 5500); // Almost done

    const performAnalysis = async () => {
      const startTime = Date.now();
      try {
        const uploadDataStr = sessionStorage.getItem('hymnmatch_upload');
        if (!uploadDataStr) {
          // If no image, wait a bit and go to suggestions with mock data
          setTimeout(() => navigate('/suggestions'), 3000);
          return;
        }

        const uploadData = JSON.parse(uploadDataStr);
        
        // Ensure backend call is made
        const response = await fetch('http://localhost:5000/api/analyze-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(uploadData)
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data = await response.json();
        
        // Save the results
        sessionStorage.setItem('hymnmatch_results', JSON.stringify(data));
        
        // Navigate once both API completes AND the minimum UX animation time (e.g. 5.5s) has elapsed
        const timeElapsed = Date.now() - startTime;
        const timeToWait = Math.max(0, 5500 - timeElapsed);
        
        setTimeout(() => {
          setStep(5);
          navigate('/suggestions');
        }, timeToWait);
        
      } catch (err) {
        console.error(err);
        alert("Failed to analyze the document. Please ensure your backend is running on port 5000 and Gemini API Key is valid.");
        navigate('/home');
      }
    };

    performAnalysis();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [navigate]);

  const renderStep = (currentStepIndex, text) => {
    if (step > currentStepIndex) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">{text}</span>
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <FiCheck size={14} className="text-emerald-600" />
          </div>
        </div>
      );
    } else if (step === currentStepIndex) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-purple-700 font-bold">{text}...</span>
          <FiLoader size={18} className="text-purple-600 animate-spin" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-between opacity-50">
          <span className="text-slate-500 font-medium">{text}</span>
          <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-purple-100 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent animate-spin absolute top-0 left-0"></div>
          <div className="text-purple-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-10">Analyzing liturgical document...</h2>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 space-y-6">
        {renderStep(0, "Uploading document")}
        {renderStep(1, "Extracting text (OCR)")}
        {renderStep(2, "Analyzing themes")}
        {renderStep(3, "Matching hymns")}
        {renderStep(4, "Finalizing")}
      </div>
      
      <p className="mt-12 text-slate-400 text-sm font-bold tracking-widest uppercase">
        Preparing your liturgical selection
      </p>
    </div>
  );
}
