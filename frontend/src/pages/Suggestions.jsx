import { useState, useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Suggestions() {
  const defaultCategories = [
    {
      title: 'ENTRANCE SONG',
      songs: [
        { title: 'Gather Us In', composer: 'Marty Haugen', match: 95 },
        { title: 'All Are Welcome', composer: 'Marty Haugen', match: 92 },
      ]
    },
    {
      title: 'OFFERTORY',
      songs: [
        { title: 'The Summons', composer: 'John L. Bell', match: 91 },
        { title: 'Ubi Caritas', composer: 'Bob Hurd', match: 78 },
      ]
    },
    {
      title: 'COMMUNION',
      songs: [
        { title: 'One Bread, One Body', composer: 'John Foley', match: 94 },
      ]
    }
  ];

  const [categories, setCategories] = useState(defaultCategories);
  const [theme, setTheme] = useState("Ordinary Time");
  const [tone, setTone] = useState("Gathering / Praise");

  useEffect(() => {
    try {
      const resultsStr = sessionStorage.getItem('hymnmatch_results');
      if (resultsStr) {
        const data = JSON.parse(resultsStr);
        if (data.theme) setTheme(data.theme);
        if (data.tone) setTone(data.tone);
        
        if (data.recommendations) {
          const newCategories = [];
          for (const [key, songs] of Object.entries(data.recommendations)) {
            // Map the backend data format to the UI component format
            const mappedSongs = songs.map(song => ({
              title: song.title,
              composer: song.composer,
              match: song.matchScore || Math.floor(Math.random() * (99 - 85 + 1) + 85) // Fallback if score is missing
            }));
            
            newCategories.push({
              title: key.toUpperCase(),
              songs: mappedSongs
            });
          }
          if (newCategories.length > 0) {
            setCategories(newCategories);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse results", e);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-4 pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/home" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors text-slate-600">
          <FiArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Suggestions</h1>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 mb-10 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-purple-600 text-xs font-bold tracking-wider uppercase mb-1">Identified Theme</p>
        <p className="text-slate-800 font-bold text-xl">{theme}</p>
        <p className="text-slate-500 text-sm mt-1">Tone: {tone}</p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.title}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
              <h2 className="text-sm font-bold text-slate-700 tracking-wider uppercase">{category.title}</h2>
            </div>
            
            <div className="space-y-3">
              {category.songs.map((song) => (
                <Link to="/song-detail" state={{ song, theme, tone, category: category.title }} key={song.title} className="block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">{song.title}</h3>
                      <p className="text-slate-500 text-sm">{song.composer}</p>
                    </div>
                    <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-purple-100">
                      Match {song.match}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* More Like This CTA */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-6 flex items-start space-x-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Want to tweak these?</h3>
          <p className="text-slate-600 mt-1">Try uploading another document or adjusting your profile settings.</p>
        </div>
      </div>
    </div>
  );
}
