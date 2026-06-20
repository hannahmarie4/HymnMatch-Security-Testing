import { useState, useEffect } from 'react';
import { FiBookOpen, FiFileText, FiDownload, FiLoader, FiAlertCircle, FiCheckCircle, FiRotateCcw } from 'react-icons/fi';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const formatMonthHeader = (monthVal, yearVal, lang) => {
  const monthsEng = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsTag = [
    'Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo',
    'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'
  ];
  
  if (lang === 'Tagalog') {
    return `Mga Edisyon ng ${monthsTag[monthVal]} ${yearVal}`;
  }
  return `${monthsEng[monthVal]} ${yearVal} Editions`;
};

export default function Readings() {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchReadings = async (allowSync = true) => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed (e.g. 5 for June)
      
      // Get the first day of the PREVIOUS month
      const prevMonth = new Date(Date.UTC(year, month - 1, 1));
      // Get the last day of the CURRENT month
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      
      const firstDayStr = prevMonth.toISOString().split('T')[0];
      const lastDayStr = lastDay.toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('readings_list')
        .select('*')
        .gte('date', firstDayStr)
        .lte('date', lastDayStr)
        .eq('language', selectedLanguage)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      // Check if there are readings in the fetched data for the CURRENT month
      const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const currentMonthReadings = (data || []).filter(r => r.date.startsWith(currentMonthKey));

      if (currentMonthReadings.length === 0 && allowSync) {
        await syncReadings();
      } else {
        setReadings(data || []);
      }
    } catch (err) {
      console.error('Error fetching readings:', err);
      setError('Failed to fetch readings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const syncReadings = async () => {
    setSyncing(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:5000/api/readings/scrape');
      if (!res.ok) throw new Error('Scraper failed');
      const scraped = await res.json();

      if (scraped && scraped.length > 0) {
        const { data: existing, error: existErr } = await supabase
          .from('readings_list')
          .select('date, language, liturgical_title');

        if (existErr) throw existErr;

        const existingKeys = new Set(
          (existing || []).map(r => `${r.date}_${r.language}_${r.liturgical_title.trim()}`)
        );

        const newReadings = scraped.filter(r => {
          const key = `${r.date}_${r.language}_${r.liturgical_title.trim()}`;
          return !existingKeys.has(key);
        });

        if (newReadings.length > 0) {
          const { error: insertErr } = await supabase
            .from('readings_list')
            .insert(newReadings);

          if (insertErr) throw insertErr;
          setToastMessage(`Synced ${newReadings.length} new readings!`);
          setTimeout(() => setToastMessage(''), 3000);
        } else {
          setToastMessage('Database is already up to date!');
          setTimeout(() => setToastMessage(''), 3000);
        }
      }
      await fetchReadings(false);
    } catch (err) {
      console.error('Failed to sync readings:', err);
      setError('Failed to sync latest readings from Word & Life. Please try again.');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();

    // Auto-refresh readings at midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msToMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => {
      fetchReadings();
      // Set interval for subsequent midnights
      const interval = setInterval(fetchReadings, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msToMidnight);

    return () => clearTimeout(timer);
  }, [selectedLanguage]);

  const handleDownloadPDF = async (pdfUrl, title, id) => {
    if (!pdfUrl) {
      setError('Invalid PDF URL.');
      return;
    }

    setDownloadingId(id);
    try {
      // 1. Convert to Google Drive direct download URL if it's a Google Drive link
      let downloadUrl = pdfUrl;
      const gdRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
      const match = pdfUrl.match(gdRegex);
      if (match && match[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        // Trigger direct browser download
        window.open(downloadUrl, '_blank');
        setToastMessage('Reading download started');
        setTimeout(() => setToastMessage(''), 3000);
        return;
      }

      // 2. Normal PDF download flow for CORS-enabled links
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('CORS or network error');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_readings.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setToastMessage('Reading downloaded successfully');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.warn('Direct fetch failed. Opening in new tab...', err);
      // Fallback: Open in new tab
      window.open(pdfUrl, '_blank');
      setToastMessage('Reading opened in new tab');
      setTimeout(() => setToastMessage(''), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    const dateParts = dateString.split('-');
    const y = parseInt(dateParts[0], 10);
    const m = parseInt(dateParts[1], 10) - 1;
    const d = parseInt(dateParts[2], 10);
    const dateObj = new Date(y, m, d);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options).toUpperCase();
  };

  const getGroupedReadings = () => {
    const groups = {};
    readings.forEach(reading => {
      const dateParts = reading.date.split('-');
      const y = parseInt(dateParts[0], 10);
      const m = parseInt(dateParts[1], 10) - 1;
      const groupKey = `${y}_${m}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: formatMonthHeader(m, y, selectedLanguage),
          monthVal: m,
          yearVal: y,
          items: []
        };
      }
      groups[groupKey].items.push(reading);
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.yearVal !== b.yearVal) return b.yearVal - a.yearVal;
      return b.monthVal - a.monthVal;
    });

    sortedGroups.forEach(g => {
      g.items.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return sortedGroups;
  };

  return (
    <div className="max-w-3xl mx-auto py-4 pb-20">
      {/* Navigation Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Readings</h1>
      </div>

      {/* Language Filter & Sync Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={() => setSelectedLanguage('English')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedLanguage === 'English'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FiBookOpen size={16} />
            <span>English Readings</span>
          </button>
          <button
            onClick={() => setSelectedLanguage('Tagalog')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedLanguage === 'Tagalog'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FiBookOpen size={16} />
            <span>Tagalog Readings</span>
          </button>
        </div>

        <button
          onClick={syncReadings}
          disabled={syncing || loading}
          className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-md shadow-purple-600/10 disabled:opacity-75 cursor-pointer"
        >
          {syncing ? (
            <FiLoader size={16} className="animate-spin" />
          ) : (
            <FiRotateCcw size={16} />
          )}
          <span>Sync Latest Readings</span>
        </button>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <FiLoader size={40} className="text-purple-600 dark:text-purple-400 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {syncing ? 'Syncing latest readings from Word & Life...' : 'Loading readings...'}
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-red-50 dark:bg-red-950/20 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
          <FiAlertCircle size={36} className="text-red-500 dark:text-red-400" />
          <p className="text-red-600 dark:text-red-400 font-bold text-center">{error}</p>
          <button 
            onClick={() => fetchReadings(true)} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      ) : readings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
          <FiBookOpen size={44} className="text-slate-300 dark:text-slate-700" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-lg">No readings for this month</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Please check back later or update the database.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {getGroupedReadings().map((group) => (
            <div key={group.name} className="space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-3">
                <span className="w-2.5 h-6 rounded-full bg-purple-600 dark:bg-purple-400" />
                <span>{group.name}</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.items.map((reading) => (
                  <div 
                    key={reading.id} 
                    className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:border-purple-300 dark:hover:border-purple-900/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-amber-500 dark:text-amber-400 text-xs font-extrabold tracking-wider mb-2">
                        {formatDate(reading.date)}
                      </p>
                      <h3 className="text-slate-800 dark:text-slate-100 font-extrabold text-xl leading-snug mb-6">
                        {reading.liturgical_title}
                      </h3>
                    </div>

                    <div className="flex justify-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/40">
                      <button
                        onClick={() => handleDownloadPDF(reading.pdf_url, reading.liturgical_title, reading.id)}
                        disabled={downloadingId === reading.id}
                        className="w-full flex items-center justify-center space-x-2 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-75"
                      >
                        {downloadingId === reading.id ? (
                          <FiLoader size={18} className="animate-spin" />
                        ) : (
                          <FiDownload size={18} />
                        )}
                        <span>DOWNLOAD PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5 duration-300 font-semibold text-sm">
          <FiCheckCircle className="text-emerald-500 shrink-0" size={20} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
