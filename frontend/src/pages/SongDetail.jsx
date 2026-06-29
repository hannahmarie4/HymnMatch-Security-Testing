import { useState, useEffect } from 'react';
import { FiArrowLeft, FiDownload, FiStar, FiHeart, FiLoader } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import mockSongDatabase from '../data/mockSongDatabase';

export default function SongDetail() {
  const location = useLocation();
  const { savedSongs, setSavedSongs, addAuditLog } = useAuth();
  const state = location.state || {};
  
  // Destructure with robust fallbacks
  const song = state.song || {};
  const title = song.title || "Untitled Liturgical Hymn";
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedDbSong = mockSongDatabase.find(s => 
    s.title.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTitle
  ) || {};

  const theme = state.theme || song.theme || matchedDbSong.theme || "General Liturgical Praise";
  const tone = state.tone || song.tone || matchedDbSong.tone || "Liturgical / Solemn";
  const category = state.category || song.category || matchedDbSong.category || "COMMUNION";
  const liturgicalSeason = state.liturgical_season || song.liturgical_season || matchedDbSong.liturgical_season || "Ordinary Time";
  const matchScore = song.match || matchedDbSong.match || 95;

  const composer = song.composer || matchedDbSong.composer || "Traditional Liturgical Composition";
  const staticLyrics = song.lyrics || matchedDbSong.lyrics || "Standard hymn verses are currently loaded inside our core repository. Please check connection or repository data structure.";

  const isSaved = savedSongs.some(s => s.title.toLowerCase().replace(/[^a-z0-9]/g, '') === title.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const handleToggleSave = () => {
    if (isSaved) {
      setSavedSongs(prev => prev.filter(s => s.title.toLowerCase() !== title.toLowerCase()));
      if (typeof addAuditLog === 'function') {
        addAuditLog('Remove Hymn', `Removed "${title}" from saved collection.`);
      }
    } else {
      const newSavedSong = {
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        title: title,
        composer: composer,
        category: category,
        season: liturgicalSeason,
        theme: theme,
        tone: tone,
        lyrics: staticLyrics,
        isDeleting: false
      };
      setSavedSongs(prev => [...prev, newSavedSong]);
      if (typeof addAuditLog === 'function') {
        addAuditLog('Save Hymn', `Saved "${title}" to collection.`);
      }
    }
  };

  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(true);

  useEffect(() => {
    // Replaced live generative text prompt with static fallback for reliable presentation
    setLoadingLyrics(true);
    const timer = setTimeout(() => {
      setLyrics(staticLyrics);
      setLoadingLyrics(false);
    }, 400); // Simulate network load
    return () => clearTimeout(timer);
  }, [staticLyrics]);

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
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">{title}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">{composer} • {category}</p>
        <span className="inline-block bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-emerald-100 dark:border-emerald-900/50">
          {liturgicalSeason}
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
          <button className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-semibold text-sm bg-purple-50/40 dark:bg-purple-950/20 px-4 py-2 rounded-xl border border-purple-400 dark:border-purple-400 hover:bg-purple-500/10 cursor-pointer">
            <FiDownload />
            <span>PDF Download</span>
          </button>
        </div>

        <div className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-medium whitespace-pre-line">
          {loadingLyrics ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <FiLoader size={32} className="text-purple-600 dark:text-purple-400 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400">Loading liturgical lyrics...</p>
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
            <FiStar className="text-slate-300 dark:text-slate-600" size={20} />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold tracking-widest uppercase">Match {matchScore}%</span>
        </div>
        
        <button 
          onClick={handleToggleSave}
          className={`flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer ${
            isSaved 
              ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-red-500/20' 
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
