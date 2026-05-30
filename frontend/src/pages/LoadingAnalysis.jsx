import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiLoader, FiAlertTriangle, FiX } from 'react-icons/fi';

export default function LoadingAnalysis() {
  const [step, setStep] = useState(0);
  const [showSeasonMismatch, setShowSeasonMismatch] = useState(false);
  const [mismatchData, setMismatchData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate the steps purely for UX
    const timer1 = setTimeout(() => setStep(1), 1000);
    const timer2 = setTimeout(() => setStep(2), 2500);
    const timer3 = setTimeout(() => setStep(3), 4000);
    const timer4 = setTimeout(() => setStep(4), 5500);

    const performAnalysis = async () => {
      const startTime = Date.now();
      try {
        const uploadDataStr = sessionStorage.getItem('hymnmatch_upload');
        if (!uploadDataStr) {
          setTimeout(() => navigate('/suggestions'), 3000);
          return;
        }

        const uploadData = JSON.parse(uploadDataStr);

        const response = await fetch('http://localhost:5000/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadData)
        });

        if (!response.ok) throw new Error('Analysis failed');

        const data = await response.json();
        
        // ── Season Mismatch Detection ──────────────────────────────────
        const userSeason = uploadData.season || 'Ordinary Time';
        const detectedSeason = data.detectedSeason || data.theme || userSeason;
        
        // Normalize for comparison
        const normalize = (s) => s?.toLowerCase().replace(/[^a-z]/g, '') || '';
        const seasonsMatch = normalize(userSeason) === normalize(detectedSeason);

        const timeElapsed = Date.now() - startTime;
        const timeToWait = Math.max(0, 5500 - timeElapsed);

        if (!seasonsMatch && detectedSeason) {
          // Wait for animation to reach step 4, then show mismatch dialog
          setTimeout(() => {
            setStep(5);
            setMismatchData({
              userSeason,
              detectedSeason,
              themes: data.themes || [data.theme],
              tone: data.tone,
            });
            setAnalysisResult(data);
            setShowSeasonMismatch(true);
          }, timeToWait);
        } else {
          // No mismatch — continue normally
          sessionStorage.setItem('hymnmatch_results', JSON.stringify(data));
          setTimeout(() => {
            setStep(5);
            navigate('/suggestions');
          }, timeToWait);
        }
      } catch (err) {
        console.error(err);
        alert(
          'Failed to analyze the document. Please ensure your backend is running on port 5000 and Gemini API Key is valid.'
        );
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

  // ── Season choice handlers ────────────────────────────────────────────────
  const handleKeepUserSeason = () => {
    if (!analysisResult) return;
    // Keep original season — save results and navigate
    sessionStorage.setItem('hymnmatch_results', JSON.stringify(analysisResult));
    navigate('/suggestions');
  };

  const handleChangeToDetected = () => {
    if (!analysisResult || !mismatchData) return;
    // Override with detected season
    const updated = { ...analysisResult, confirmedSeason: mismatchData.detectedSeason };
    sessionStorage.setItem('hymnmatch_results', JSON.stringify(updated));
    navigate('/suggestions');
  };

  // ── Step renderer ─────────────────────────────────────────────────────────
  const renderStep = (currentStepIndex, text) => {
    if (step > currentStepIndex) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 font-medium">{text}</span>
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <FiCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      );
    } else if (step === currentStepIndex) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-purple-700 dark:text-purple-400 font-bold">{text}...</span>
          <FiLoader size={18} className="text-purple-600 dark:text-purple-400 animate-spin" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-between opacity-50">
          <span className="text-slate-500 dark:text-slate-400 font-medium">{text}</span>
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
        </div>
      );
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-purple-100 dark:border-purple-900/40 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-purple-600 dark:border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent animate-spin absolute top-0 left-0" />
          <div className="text-purple-600 dark:text-purple-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-10">
        Analyzing liturgical document...
      </h2>

      {/* Steps card */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/40 dark:border-slate-800/60 space-y-6">
        {renderStep(0, 'Uploading document')}
        {renderStep(1, 'Extracting text (OCR)')}
        {renderStep(2, 'Analyzing themes')}
        {renderStep(3, 'Matching hymns')}
        {renderStep(4, 'Finalizing')}
      </div>

      <p className="mt-12 text-slate-400 dark:text-slate-500 text-sm font-bold tracking-widest uppercase">
        Preparing your liturgical selection
      </p>

      {/* ── Season Mismatch Modal ─────────────────────────────────────────── */}
      {showSeasonMismatch && mismatchData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800 relative">
            <button
              onClick={handleKeepUserSeason}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <FiX size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FiAlertTriangle size={28} className="text-amber-500 dark:text-amber-400" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                Season Mismatch Detected
              </h3>

              {/* Comparison */}
              <div className="w-full space-y-3 text-left">
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">
                    You selected
                  </p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {mismatchData.userSeason.toUpperCase()}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/40">
                  <p className="text-xs font-bold text-purple-500 dark:text-purple-400 tracking-wider uppercase mb-1">
                    Based on the reading, this appears to be
                  </p>
                  <p className="text-lg font-extrabold text-purple-700 dark:text-purple-300">
                    {mismatchData.detectedSeason.toUpperCase()}
                  </p>
                </div>
              </div>

              {mismatchData.themes && mismatchData.themes.length > 0 && (
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  The reading discusses themes of{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {mismatchData.themes.join(', ')}
                  </span>.
                </p>
              )}

              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                Which season would you like to use?
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
                <button
                  onClick={handleKeepUserSeason}
                  className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                >
                  Keep {mismatchData.userSeason.toUpperCase()}
                </button>
                <button
                  onClick={handleChangeToDetected}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm"
                >
                  Change to {mismatchData.detectedSeason.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
