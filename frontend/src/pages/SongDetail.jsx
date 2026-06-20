import { useState, useEffect } from 'react';
import { FiArrowLeft, FiDownload, FiStar, FiHeart, FiLoader } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SongDetail() {
  const location = useLocation();
  const { savedSongs, setSavedSongs, addAuditLog } = useAuth();
  const state = location.state || {};

  // Destructure with fallbacks if accessed directly without state
  const song = state.song || { title: "Amazing Grace", composer: "Traditional", match: 95 };
  const theme = state.theme || "Grace";
  const tone = state.tone || "Hopeful";
  const category = state.category || "COMMUNION";

  const isSaved = savedSongs.some(s => s.title.toLowerCase() === song.title.toLowerCase());

  const handleToggleSave = () => {
    if (isSaved) {
      setSavedSongs(prev => prev.filter(s => s.title.toLowerCase() !== song.title.toLowerCase()));
      if (typeof addAuditLog === 'function') {
        addAuditLog('Remove Hymn', `Removed "${song.title}" from saved collection.`);
      }
    } else {
      const newSavedSong = {
        id: Date.now(),
        title: song.title,
        category: category,
        season: 'ORDINARY TIME',
        isDeleting: false
      };
      setSavedSongs(prev => [...prev, newSavedSong]);
      if (typeof addAuditLog === 'function') {
        addAuditLog('Save Hymn', `Saved "${song.title}" to collection.`);
      }
    }
  };

  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(true);

  useEffect(() => {
    const fetchLyrics = async () => {
      setLoadingLyrics(true);
      try {
        const res = await fetch('http://127.0.0.1:5000/api/lyrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: song.title, composer: song.composer })
        });

        if (res.ok) {
          const data = await res.json();
          setLyrics(data.lyrics);
        } else {
          setLyrics("Failed to load lyrics. Please try again later.");
        }
      } catch (err) {
        console.error("Lyrics fetch error:", err);
        setLyrics("Could not connect to the server to load lyrics.");
      } finally {
        setLoadingLyrics(false);
      }
    };

    fetchLyrics();
  }, [song]);

  const fromSaved = state.fromSaved || false;
  const backPath = fromSaved ? '/saved' : '/suggestions';

  return (
    <div className="max-w-3xl mx-auto py-4 pb-24">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={backPath} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-slate-600 dark:text-slate-300">
          <FiArrowLeft size={20} />
        </Link>
        <span className="font-medium text-slate-500 dark:text-slate-400">Song Detail</span>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{song.title}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">{song.composer} • {category}</p>
        <span className="inline-block bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-emerald-100 dark:border-emerald-900/50">
          Ordinary Time
        </span>
      </div>

      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-2xl p-5 mb-8 flex items-start space-x-4">
        <span className="text-xl">✨</span>
        <p className="text-purple-800 dark:text-purple-300 font-medium">
          Matched via theme: <span className="font-bold">{theme}</span> • Tone: <span className="font-bold">{tone}</span>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-slate-100 dark:border-slate-800/60 shadow-sm relative mb-8 min-h-[300px]">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-sm">Lyrics / Preview</p>
          <button className="flex items-center space-x-2 text-slate-500 dark:text-slate-450 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium text-sm bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 cursor-pointer">
            <FiDownload />
            <span>PDF Download</span>
          </button>
        </div>

        <div className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-medium whitespace-pre-wrap">
          {loadingLyrics ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <FiLoader size={32} className="text-purple-600 dark:text-purple-400 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400">Fetching liturgical lyrics...</p>
            </div>
          ) : (
            lyrics
          )}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky bottom-8">
        <div className="flex items-center space-x-4">
          <div className="flex text-amber-400">
            <FiStar className="fill-current" size={20} />
            <FiStar className="fill-current" size={20} />
            <FiStar className="fill-current" size={20} />
            <FiStar className="fill-current" size={20} />
            <FiStar size={20} />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold tracking-widest uppercase">Match {song.match}%</span>
        </div>

        <button
          onClick={handleToggleSave}
          className={`flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer ${isSaved
              ? 'bg-red-550 text-white hover:bg-red-600 hover:shadow-red-500/20'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/30'
            }`}
        >
          <FiHeart size={20} className={isSaved ? 'fill-current' : ''} />
          <span>{isSaved ? 'Saved' : 'Save Song'}</span>
        </button>
      </div>
    </div>
  );
}
