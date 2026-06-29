import { useState, useEffect, useRef } from 'react';
import { FiHeart, FiMinus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import mockSongDatabase from '../data/mockSongDatabase';

export default function SavedSongs() {
  const { savedSongs: songs, setSavedSongs: setSongs, addAuditLog } = useAuth();

  const [toastMessage, setToastMessage] = useState('');
  const [deletedSong, setDeletedSong] = useState(null);
  const deleteTimeoutRef = useRef(null);

  const handleDeleteClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    const songToDelete = songs.find(s => s.id === id);
    if (!songToDelete) return;

    // Trigger fading out transition classes
    setSongs(prevSongs =>
      prevSongs.map(song => (song.id === id ? { ...song, isDeleting: true } : song))
    );

    // Filter from state after transition duration (300ms)
    setTimeout(() => {
      setSongs(prevSongs => prevSongs.filter(song => song.id !== id));
      
      setDeletedSong(songToDelete);
      setToastMessage("Song removed from Saved Songs.");
      
      if (typeof addAuditLog === 'function') {
        addAuditLog('Remove Hymn', `Removed "${songToDelete.title}" from saved collection.`);
      }
      
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      
      deleteTimeoutRef.current = setTimeout(() => {
        // Permanent deletion logic here
        setToastMessage('');
        setDeletedSong(null);
      }, 5000);
    }, 300);
  };

  const handleUndo = () => {
    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    
    if (deletedSong) {
      setSongs(prevSongs => {
        const restored = { ...deletedSong, isDeleting: false };
        return [...prevSongs, restored].sort((a, b) => a.id - b.id);
      });
      setToastMessage('');
      setDeletedSong(null);
    }
  };

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  const activeSongsCount = songs.filter(s => !s.isDeleting).length;

  return (
    <div className="max-w-3xl mx-auto py-4">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Saved Songs</h1>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 text-9xl">✨</div>
          <p className="text-purple-200 text-xs font-bold tracking-widest uppercase mb-2">Collection</p>
          <h2 className="text-3xl font-bold mb-2">Spiritual Sanctuary</h2>
          <p className="text-purple-100">{activeSongsCount} {activeSongsCount === 1 ? 'song' : 'songs'} curated for reflection.</p>
        </div>
        
        <div className="col-span-1 bg-gradient-to-br from-amber-300 to-amber-500 rounded-3xl p-8 text-amber-900 flex flex-col items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-5xl font-extrabold mb-1">{activeSongsCount}</span>
          <span className="text-amber-800 font-bold tracking-widest uppercase text-xs">Total</span>
        </div>
      </div>

      <div className="space-y-3">
        {songs.map((song) => {
          const dbSong = mockSongDatabase.find(s => 
            s.title.toLowerCase().replace(/[^a-z0-9]/g, '') === song.title.toLowerCase().replace(/[^a-z0-9]/g, '')
          ) || {};
          
          return (
            <div
              key={song.id}
              className={`transition-all duration-300 transform origin-center ${
                song.isDeleting
                  ? 'opacity-0 scale-95 max-h-0 py-0 my-0 border-0 overflow-hidden pointer-events-none'
                  : 'opacity-100 scale-100 max-h-40'
              }`}
            >
              <Link
                to="/song-detail"
                state={{
                  song: { 
                    title: song.title, 
                    composer: song.composer || dbSong.composer || 'Traditional', 
                    match: song.match || dbSong.match || 95,
                    lyrics: song.lyrics || dbSong.lyrics 
                  },
                  theme: song.theme || dbSong.theme || song.season,
                  tone: song.tone || dbSong.tone || 'Liturgical',
                  category: song.category || dbSong.category,
                  liturgical_season: song.season || dbSong.liturgical_season || 'Ordinary Time',
                  fromSaved: true // Block False Redirection indicator
                }}
                className="flex items-center justify-between bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/40 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800/50 transition-all group"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors mb-1">
                  {song.title}
                </h3>
                <div className="flex items-center space-x-3 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  <span className="text-purple-600 dark:text-purple-400">{song.category}</span>
                  <span>•</span>
                  <span>{song.season}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                  title="Saved"
                >
                  <FiHeart size={18} className="fill-current" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, song.id)}
                  className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                  title="Remove from Saved Songs"
                >
                  <FiMinus size={18} />
                </button>
              </div>
            </Link>
          </div>
          );
        })}
        {songs.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium">No saved songs yet.</p>
            <p className="text-sm mt-1">Hymns you save will appear here.</p>
          </div>
        )}
      </div>

      {/* Undo Toast Notification */}
      <div 
        className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
      >
        <div className="bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-4 border border-slate-700 dark:border-slate-600">
          <span className="font-medium text-sm">{toastMessage || "Song removed from Saved Songs."}</span>
          <div className="w-px h-4 bg-slate-700 dark:bg-slate-600"></div>
          <button 
            onClick={handleUndo}
            className="text-purple-400 hover:text-purple-300 font-bold text-sm tracking-wide uppercase transition-colors cursor-pointer"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
}
