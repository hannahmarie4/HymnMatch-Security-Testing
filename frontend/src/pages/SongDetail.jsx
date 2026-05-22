import { useState, useEffect } from 'react';
import { FiArrowLeft, FiDownload, FiStar, FiHeart, FiLoader } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

export default function SongDetail() {
  const location = useLocation();
  const state = location.state || {};
  
  // Destructure with fallbacks if accessed directly without state
  const song = state.song || { title: "Amazing Grace", composer: "Traditional", match: 95 };
  const theme = state.theme || "Grace";
  const tone = state.tone || "Hopeful";
  const category = state.category || "COMMUNION";

  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(true);

  useEffect(() => {
    const fetchLyrics = async () => {
      setLoadingLyrics(true);
      try {
        const res = await fetch('http://localhost:5000/api/lyrics', {
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

  return (
    <div className="max-w-3xl mx-auto py-4 pb-24">
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/suggestions" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors text-slate-600">
          <FiArrowLeft size={20} />
        </Link>
        <span className="font-medium text-slate-500">Song Detail</span>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">{song.title}</h1>
        <p className="text-slate-600 text-lg mb-4">{song.composer} • {category}</p>
        <span className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-emerald-100">
          Ordinary Time
        </span>
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8 flex items-start space-x-4">
        <span className="text-xl">✨</span>
        <p className="text-purple-800 font-medium">
          Matched via theme: <span className="font-bold">{theme}</span> • Tone: <span className="font-bold">{tone}</span>
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative mb-8 min-h-[300px]">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Lyrics / Preview</p>
          <button className="flex items-center space-x-2 text-slate-500 hover:text-purple-600 transition-colors font-medium text-sm bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-purple-200">
            <FiDownload />
            <span>PDF Download</span>
          </button>
        </div>

        <div className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap">
          {loadingLyrics ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <FiLoader size={32} className="text-purple-600 animate-spin" />
              <p className="text-slate-500">Fetching liturgical lyrics...</p>
            </div>
          ) : (
            lyrics
          )}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky bottom-8">
        <div className="flex items-center space-x-4">
          <div className="flex text-amber-400">
            <FiStar className="fill-current" size={20} />
            <FiStar className="fill-current" size={20} />
            <FiStar className="fill-current" size={20} />
            <FiStar className="fill-current" size={20} />
            <FiStar size={20} />
          </div>
          <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Match {song.match}%</span>
        </div>
        
        <button className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5">
          <FiHeart size={20} />
          <span>Save Song</span>
        </button>
      </div>
    </div>
  );
}
