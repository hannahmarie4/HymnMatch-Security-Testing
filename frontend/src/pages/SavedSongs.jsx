import { FiHeart } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function SavedSongs() {
  const savedSongs = [
    { title: 'Amazing Grace', category: 'COMMUNION', season: 'ORDINARY TIME' },
    { title: 'Be Not Afraid', category: 'ENTRANCE', season: 'LENT' },
    { title: 'Here I Am Lord', category: 'OFFERTORY', season: 'EASTER' },
    { title: 'One Bread, One Body', category: 'COMMUNION', season: 'ORDINARY TIME' },
    { title: 'O Come, O Come Emmanuel', category: 'ENTRANCE', season: 'ADVENT' },
    { title: 'Joy to the World', category: 'RECESSIONAL', season: 'CHRISTMAS' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-4">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Saved Songs</h1>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 text-9xl">✨</div>
          <p className="text-purple-200 text-xs font-bold tracking-widest uppercase mb-2">Collection</p>
          <h2 className="text-3xl font-bold mb-2">Spiritual Sanctuary</h2>
          <p className="text-purple-100">6 songs curated for reflection.</p>
        </div>
        
        <div className="col-span-1 bg-gradient-to-br from-amber-300 to-amber-500 rounded-3xl p-8 text-amber-900 flex flex-col items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-5xl font-extrabold mb-1">6</span>
          <span className="text-amber-800 font-bold tracking-widest uppercase text-xs">Total</span>
        </div>
      </div>

      <div className="space-y-3">
        {savedSongs.map((song, i) => (
          <Link to="/song-detail" key={i} className="flex items-center justify-between bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors mb-1">{song.title}</h3>
              <div className="flex items-center space-x-3 text-xs font-bold tracking-wider uppercase text-slate-400">
                <span className="text-purple-600">{song.category}</span>
                <span>•</span>
                <span>{song.season}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors">
              <FiHeart size={18} className="fill-current" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
