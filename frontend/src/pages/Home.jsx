import { useState, useEffect, useRef, useCallback } from 'react';
import { FiCamera, FiFileText, FiStar, FiClock, FiX, FiAlertTriangle, FiCheck, FiRotateCcw, FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';

// ── Device Detection ─────────────────────────────────────────────────────────
const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ── Blur Detection (Laplacian variance via OffscreenCanvas / fallback) ───────
const detectBlur = (imageFile) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const SAMPLE = 256; // downscale for speed
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

        // Convert to greyscale
        const grey = [];
        for (let i = 0; i < data.length; i += 4) {
          grey.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }

        // Laplacian kernel variance — low value = blurry
        let sum = 0, sumSq = 0;
        const W = SAMPLE;
        for (let y = 1; y < W - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const idx = y * W + x;
            const lap =
              -grey[idx - W - 1] - grey[idx - W] - grey[idx - W + 1]
              - grey[idx - 1] + 8 * grey[idx] - grey[idx + 1]
              - grey[idx + W - 1] - grey[idx + W] - grey[idx + W + 1];
            sum += lap;
            sumSq += lap * lap;
          }
        }
        const n = (W - 2) * (W - 2);
        const mean = sum / n;
        const variance = sumSq / n - mean * mean;

        URL.revokeObjectURL(url);
        // Threshold: variance < 120 → blurry (tune to taste)
        resolve(variance < 120);
      } catch {
        URL.revokeObjectURL(url);
        resolve(false); // if detection fails, allow upload
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });

// ── Helpers ───────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const formatBytes = (b) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

// ═════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const navigate = useNavigate();
  const isMobile = isMobileDevice();

  // refs for hidden inputs
  const cameraInputRef = useRef(null);  // mobile camera capture
  const imageInputRef  = useRef(null);  // desktop image file picker
  const fileInputRef   = useRef(null);  // any-device file picker (PDF/IMG)

  // Flow state machine
  // 'idle' | 'blur-checking' | 'blur-error' | 'preview' | 'file-error' | 'processing'
  const [flow, setFlow] = useState('idle');
  const [uploadMode, setUploadMode] = useState(null); // 'image' | 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Liturgical season
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  let season = 'Ordinary Time';
  let seasonColor = 'bg-emerald-500';
  let seasonBg = 'bg-emerald-50';
  let seasonBorder = 'border-emerald-200';
  let seasonShadow = 'shadow-emerald-500/50';

  if (today.getMonth() === 4 && today.getDate() <= 24) {
    season = 'Easter Season';
    seasonColor = 'bg-amber-400';
    seasonBg = 'bg-amber-50';
    seasonBorder = 'border-amber-200';
    seasonShadow = 'shadow-amber-500/50';
  }

  // ── Cleanup preview URLs ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [previewUrl, pdfPreviewUrl]);

  // ── Reset all flow state ──────────────────────────────────────────────────
  const resetFlow = useCallback(() => {
    setFlow('idle');
    setUploadMode(null);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPreviewUrl(null);
    setPdfPreviewUrl(null);
    setErrorMsg('');
    setProcessingStatus('');
    // Reset file inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl, pdfPreviewUrl]);

  // ── Process image after selection (blur check → preview) ─────────────────
  const processImageFile = useCallback(async (file) => {
    setFlow('blur-checking');
    const blurry = await detectBlur(file);
    if (blurry) {
      setSelectedFile(file);
      setFlow('blur-error');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFlow('preview');
  }, []);

  // ── Process file after selection (validate → preview) ────────────────────
  const processFileUpload = useCallback((file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg('File type not supported. Please upload PDF, JPG, or PNG only.');
      setFlow('file-error');
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg(`File is too large (${formatBytes(file.size)}). Maximum size is 10 MB.`);
      setFlow('file-error');
      return;
    }
    setSelectedFile(file);
    if (file.type === 'application/pdf') {
      setPdfPreviewUrl(URL.createObjectURL(file));
      setPreviewUrl(null);
    } else {
      setPreviewUrl(URL.createObjectURL(file));
      setPdfPreviewUrl(null);
    }
    setFlow('preview');
  }, []);

  // ── Input change handlers ─────────────────────────────────────────────────
  const handleCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFileUpload(file);
  };

  // ── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      processFileUpload(file);
    } else if (file.type.startsWith('image/')) {
      processImageFile(file);
    } else {
      setErrorMsg('File type not supported. Please upload PDF, JPG, or PNG only.');
      setFlow('file-error');
    }
  };

  // ── Button click handlers ─────────────────────────────────────────────────
  const onClickUploadImage = () => {
    setUploadMode('image');
    if (isMobile) {
      cameraInputRef.current?.click();
    } else {
      imageInputRef.current?.click();
    }
  };

  const onClickUploadFile = () => {
    setUploadMode('file');
    fileInputRef.current?.click();
  };

  // ── Retake / re-pick ──────────────────────────────────────────────────────
  const onRetake = () => {
    if (uploadMode === 'image') {
      if (isMobile) cameraInputRef.current?.click();
      else imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  // ── Confirm → proceed to client-side OCR & recommendations ────────────────
  const onConfirm = async () => {
    if (!selectedFile) return;
    
    setFlow('processing');
    setProcessingStatus('Running Client-Side OCR...');

    try {
      let extractedText = '';

      if (selectedFile.type === 'application/pdf') {
        setProcessingStatus('Parsing PDF Document...');
        // Standard client-side text extractor fallback
        const text = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const content = reader.result;
            // Extract alphanumeric words to construct raw unstructured text
            const matches = content.match(/[\w\s,.-]{4,}/g);
            resolve(matches ? matches.slice(0, 1000).join(' ') : 'PDF Liturgical Text');
          };
          reader.readAsText(selectedFile.slice(0, 80000));
        });
        extractedText = text;
      } else {
        // Image: run client-side OCR using Tesseract.js
        const result = await Tesseract.recognize(selectedFile, 'eng', {
          logger: m => {
            if (m.status === 'recognizing') {
              setProcessingStatus(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        extractedText = result.data.text;
      }

      if (!extractedText.trim()) {
        throw new Error('Could not extract any readable text from the document. Please verify it is a clear image.');
      }

      setProcessingStatus('Fetching Song Suggestions...');

      const response = await fetch('http://127.0.0.1:5000/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: extractedText,
          season: season
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error generating recommendations.');
      }

      const data = await response.json();
      
      // Store raw JSON array in sessionStorage
      sessionStorage.setItem('hymnmatch_results', JSON.stringify(data));
      
      setFlow('idle');
      navigate('/suggestions');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete document analysis.');
      setFlow('file-error');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // OVERLAY MODALS
  // ══════════════════════════════════════════════════════════════════════════

  const ModalWrapper = ({ children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={resetFlow}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <FiX size={22} />
        </button>
        {children}
      </div>
    </div>
  );

  // ── Blur Checking Overlay ─────────────────────────────────────────────────
  const BlurCheckingOverlay = () => (
    <ModalWrapper>
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <FiLoader size={40} className="text-purple-600 dark:text-purple-400 animate-spin" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Checking image quality...</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Analyzing sharpness and focus</p>
      </div>
    </ModalWrapper>
  );

  // ── Blur Error Overlay ────────────────────────────────────────────────────
  const BlurErrorOverlay = () => (
    <ModalWrapper>
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <FiAlertTriangle size={28} className="text-orange-500 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Image Too Blurry</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          The image is too blurry to read clearly.<br />
          Please {isMobile && uploadMode === 'image' ? 'take another photo' : 'choose a clearer image'} with better lighting and focus.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all"
          >
            <FiCamera size={18} />
            <span>{isMobile && uploadMode === 'image' ? 'Take Another Photo' : 'Choose Different Image'}</span>
          </button>
          <button
            onClick={resetFlow}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalWrapper>
  );

  // ── File Error Overlay ────────────────────────────────────────────────────
  const FileErrorOverlay = () => (
    <ModalWrapper>
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <FiAlertTriangle size={28} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Error Occurred</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all"
          >
            <FiFileText size={18} />
            <span>Choose Different File</span>
          </button>
          <button
            onClick={resetFlow}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalWrapper>
  );

  // ── Preview & Confirm Overlay ─────────────────────────────────────────────
  const PreviewOverlay = () => {
    const isImage = uploadMode === 'image' || (selectedFile && selectedFile.type !== 'application/pdf');
    const isPdf = selectedFile?.type === 'application/pdf';
    const retakeLabel = uploadMode === 'image'
      ? (isMobile ? 'Retake Photo' : 'Choose Different Image')
      : 'Choose Different File';

    return (
      <ModalWrapper>
        <div className="space-y-4">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 pr-8">
            {uploadMode === 'image' ? 'Confirm Image' : 'Confirm File'}
          </h3>

          {/* Preview area */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 w-full">
            {isImage && previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-72 object-contain"
              />
            )}
            {isPdf && pdfPreviewUrl && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <FiFileText size={28} className="text-red-500 dark:text-red-400" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-bold text-sm text-center px-4">
                  {selectedFile?.name}
                </span>
                <a
                  href={pdfPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-600 dark:text-purple-400 underline hover:text-purple-800 dark:hover:text-purple-300"
                >
                  Preview PDF ↗
                </a>
              </div>
            )}
          </div>

          {/* File meta */}
          {selectedFile && (
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-2">
              <span className="truncate max-w-[60%] font-medium text-slate-600 dark:text-slate-300">
                {selectedFile.name}
              </span>
              <span>{formatBytes(selectedFile.size)}</span>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium text-center">
            Is this the correct {uploadMode === 'image' ? 'image' : 'file'}?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={onRetake}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <FiRotateCcw size={16} />
              <span>{retakeLabel}</span>
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <FiCheck size={18} />
              <span>Confirm</span>
            </button>
          </div>
        </div>
      </ModalWrapper>
    );
  };

  // ── Client-Side Processing Overlay ──────────────────────────────────────────
  const ProcessingOverlay = () => (
    <ModalWrapper>
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <FiLoader size={40} className="text-purple-600 dark:text-purple-400 animate-spin" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{processingStatus}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
          Analyzing and extracting text from your liturgical document...
        </p>
      </div>
    </ModalWrapper>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto py-4">

      {/* ── Hidden File Inputs ── */}
      <input
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleCameraChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/jpeg,image/png"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Header ── */}
      <div className="mb-10">
        <p className="text-purple-600 dark:text-purple-400 text-xs font-bold tracking-widest uppercase mb-2">
          | Today in the Liturgy
        </p>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {dateString}
        </h1>
      </div>

      {/* ── Liturgical Season Box ── */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 mb-10 flex items-center space-x-4 border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-300">
        <div className={`w-10 h-10 rounded-full border ${seasonBorder} dark:border-opacity-20 flex items-center justify-center ${seasonBg} dark:bg-opacity-10 transition-colors duration-500`}>
          <div className={`w-3 h-3 rounded-full ${seasonColor} shadow-sm ${seasonShadow}`} />
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-wider uppercase mb-1">Liturgical Season</p>
          <p className="text-slate-800 dark:text-slate-200 font-bold text-lg">{season}</p>
        </div>
      </div>

      {/* ── Upload Section ── */}
      <div className="mb-10">
        <p className="text-slate-700 dark:text-slate-300 text-sm font-bold mb-4">Upload a liturgical document</p>

        {/* Drop zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center mb-6 transition-all ${
            isDragging 
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20' 
              : 'border-purple-200 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700'
          }`}
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
            <FiFileText size={28} className="text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-slate-800 dark:text-slate-200 font-bold text-xl mb-1 text-center">
            {isMobile ? 'Take a photo or pick a file' : 'Select an image or file from your computer'}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">PDF, JPG, PNG — up to 10 MB</p>
        </div>

        {/* Action buttons */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <button
            onClick={onClickUploadImage}
            className="flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base hover:shadow-lg hover:shadow-purple-500/30 dark:hover:shadow-purple-900/50 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <FiCamera size={22} />
            <span>{isMobile ? 'Take Photo' : 'Upload Image'}</span>
          </button>

          <button
            onClick={onClickUploadFile}
            className="flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl border-2 border-purple-200 dark:border-purple-800/60 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold text-base hover:bg-purple-50 dark:hover:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <FiFileText size={22} />
            <span>Upload File</span>
          </button>
        </div>

        <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-3 font-medium">
          {isMobile
            ? '"Take Photo" opens your camera. "Upload File" opens your file browser.'
            : '"Upload Image" picks a JPG/PNG. "Upload File" picks a PDF or image.'}
        </p>
      </div>

      {/* ── Info Cards ── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:bg-slate-800/80 transition-all">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <FiStar size={20} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-1">Smart Match</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Suggested hymns based on today's readings</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:bg-slate-800/80 transition-all relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600" />
          <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-4 ml-3">
            <FiClock size={20} className="text-orange-500 dark:text-orange-400" />
          </div>
          <h3 className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-1 ml-3">Last Uploaded</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-3">Propers for 30th Sunday</p>
        </div>
      </div>

      {/* Overlays */}
      {flow === 'blur-checking' && <BlurCheckingOverlay />}
      {flow === 'blur-error'    && <BlurErrorOverlay />}
      {flow === 'file-error'    && <FileErrorOverlay />}
      {flow === 'preview'       && <PreviewOverlay />}
      {flow === 'processing'    && <ProcessingOverlay />}
    </div>
  );
}
