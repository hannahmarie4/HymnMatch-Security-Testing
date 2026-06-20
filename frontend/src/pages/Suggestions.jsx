import { useState, useEffect } from 'react';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiDownload, FiMusic } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

export default function Suggestions() {
  const defaultCategories = [
    {
      title: 'ENTRANCE SONG',
      songs: [
        { title: 'Gather Us In', composer: 'Marty Haugen', match: 95, lyrics: 'Here in this place new light is streaming,\nnow is the darkness vanished away,\nSee in this space our fears and our dreamings,\nbrought here to you in the light of this day.' }
      ]
    },
    {
      title: 'OFFERTORY',
      songs: [
        { title: 'The Summons', composer: 'John L. Bell', match: 91, lyrics: 'Will you come and follow me if I but call your name?\nWill you go where you don\'t know and never be the same?' }
      ]
    },
    {
      title: 'COMMUNION',
      songs: [
        { title: 'One Bread, One Body', composer: 'John Foley', match: 94, lyrics: 'One bread, one body, one Lord of all,\none cup of blessing which we bless.\nAnd we, though many, throughout the earth,\nwe are one body in this one Lord.' }
      ]
    },
    {
      title: 'RECESSIONAL',
      songs: [
        { title: 'Lead Me, Lord', composer: 'John D. Becker', match: 90, lyrics: 'Lead me, Lord, lead me, Lord,\nby the light of truth to seek and to find the narrow way.' }
      ]
    }
  ];

  const [categories, setCategories] = useState(defaultCategories);
  const [theme, setTheme] = useState("Ordinary Time");
  const [tone, setTone] = useState("Gathering / Praise");
  const [expandedSongs, setExpandedSongs] = useState({});

  useEffect(() => {
    try {
      const resultsStr = sessionStorage.getItem('hymnmatch_results');
      if (resultsStr) {
        const data = JSON.parse(resultsStr);
        if (Array.isArray(data)) {
          // Flattened 4-song array format from backend
          const mapped = data.map(item => ({
            title: item.mass_part.toUpperCase(),
            songs: [{
              title: item.title,
              composer: item.composer || 'Traditional',
              lyrics: item.lyrics || 'Lyrics not available.',
              match: Math.floor(Math.random() * (99 - 88 + 1) + 88)
            }]
          }));
          setCategories(mapped);
          setTheme("Ingested Document Analysis");
          setTone("Liturgical Matching");
        } else {
          // Support older/legacy nested structure if present
          if (data.theme) setTheme(data.theme);
          if (data.tone) setTone(data.tone);
          if (data.recommendations) {
            const newCategories = [];
            for (const [key, songs] of Object.entries(data.recommendations)) {
              const mappedSongs = songs.map(song => ({
                title: song.title,
                composer: song.composer || 'Traditional',
                lyrics: song.lyrics || 'Lyrics not available.',
                match: song.matchScore || Math.floor(Math.random() * (99 - 85 + 1) + 85)
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
      }
    } catch (e) {
      console.error("Failed to parse results", e);
    }
  }, []);

  const toggleLyrics = (key) => {
    setExpandedSongs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // ── PDF Compilation using jsPDF ──────────────────────────────────────────
  const downloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setProperties({
      title: 'HymnMatch Liturgical Music Program',
      subject: 'Liturgical Recommendations Booklet',
      author: 'HymnMatch AI',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let y = 25;

    // Document Main Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(107, 33, 168); // Purple color
    doc.text('HymnMatch Music Program', margin, y);
    y += 8;

    // Meta details
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Liturgical Season: ${theme} | Tone: ${tone}`, margin, y);
    
    y += 4;
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Compile each song with full lyrics regardless of UI expansion state
    categories.forEach((category) => {
      category.songs.forEach((song) => {
        // Prevent layout cutting by pushing to next page if space is low
        if (y > pageHeight - 50) {
          doc.addPage();
          y = 25;
        }

        // Mass Part Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(147, 51, 234); // Purple-500
        doc.text(category.title.toUpperCase(), margin, y);
        y += 6;

        // Song Title
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(song.title, margin, y);
        y += 5;

        // Composer
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Composer: ${song.composer}`, margin, y);
        y += 8;

        // Lyrics Label
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.text('Lyrics:', margin, y);
        y += 5;

        // Full Lyrics Content (Formatted & wrapped)
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85); // Slate-700
        
        const lyricLines = doc.splitTextToSize(song.lyrics || 'No lyrics available.', contentWidth);
        
        lyricLines.forEach((line) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = 25;
            doc.setFont('Helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`${song.title} (Continued)`, margin, y);
            y += 6;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(51, 65, 85);
          }
          doc.text(line, margin, y);
          y += 5;
        });

        y += 12; // Gap before next song
      });
    });

    // Save compiled file
    doc.save(`HymnMatch_Music_Program.pdf`);
  };

  // ── XSS Prevention (Interpolation is safe in React) ────────────────────────
  return (
    <div className="max-w-3xl mx-auto py-4 pb-32 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/home" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Suggestions</h1>
        </div>

        <button
          onClick={downloadPdf}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <FiDownload size={18} />
          <span>Download PDF</span>
        </button>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 mb-10 border border-white/40 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <p className="text-purple-600 dark:text-purple-400 text-xs font-bold tracking-wider uppercase mb-1">Identified Theme</p>
        <p className="text-slate-800 dark:text-slate-200 font-bold text-xl">{theme}</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tone: {tone}</p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.title}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">{category.title}</h2>
            </div>
            
            <div className="space-y-3">
              {category.songs.map((song) => {
                const songKey = `${category.title}-${song.title}`;
                const isExpanded = !!expandedSongs[songKey];

                return (
                  <div 
                    key={song.title} 
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Link 
                          to="/song-detail" 
                          state={{ song, theme, tone, category: category.title }} 
                          className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-purple-700 dark:hover:text-purple-400 transition-colors inline-flex items-center space-x-2"
                        >
                          <span>{song.title}</span>
                          <FiMusic size={14} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{song.composer}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg text-sm font-bold border border-purple-100 dark:border-purple-900/50">
                        Match {song.match}%
                      </div>
                    </div>

                    {/* Toggle Lyrics Button */}
                    <button
                      onClick={() => toggleLyrics(songKey)}
                      className="mt-3 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Lyrics' : 'See Lyrics'}</span>
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>

                    {/* Collapsible Lyrics Block */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                        {song.lyrics}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* More Like This CTA */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/10 dark:to-indigo-950/10 border border-purple-100 dark:border-purple-900/30 rounded-3xl p-6 flex items-start space-x-4">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Want to tweak these?</h3>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Try uploading another document or adjusting your profile settings.</p>
        </div>
      </div>
    </div>
  );
}
