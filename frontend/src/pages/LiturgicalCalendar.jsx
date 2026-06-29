import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiLoader } from 'react-icons/fi';

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const years = [2025, 2026, 2027, 2028];

export default function LiturgicalCalendar() {
  const systemToday = new Date();
  const [selectedMonth, setSelectedMonth] = useState(systemToday.getMonth() + 1); // 1-indexed (e.g. 6 for June)
  const [selectedYear, setSelectedYear] = useState(systemToday.getFullYear());
  const [calendarData, setCalendarData] = useState([]);
  const [activeDate, setActiveDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      setError(null);
      try {
        const laptopIp = window.location.hostname || 'localhost';
        const response = await fetch(`http://${laptopIp}:5000/api/calendar/${selectedYear}/${selectedMonth}`);
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        const data = await response.json();
        setCalendarData(data);
        
        // Retain active date if it exists in the new month, otherwise default to today (or day 1)
        const today = new Date();
        const isCurrentMonthYear = selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear();
        if (isCurrentMonthYear && data.length >= today.getDate()) {
            setActiveDate(data[today.getDate() - 1]);
        } else if (activeDate && activeDate.day <= data.length) {
            setActiveDate(data[activeDate.day - 1]);
        } else {
            setActiveDate(data[0]);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load liturgical calendar data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      if (selectedYear > 2025) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      }
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      if (selectedYear < 2028) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      }
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getDayTextColor = (color) => {
    switch (color) {
      case 'red': return 'text-red-600 dark:text-red-400';
      case 'violet': return 'text-purple-600 dark:text-purple-400';
      case 'rose': return 'text-pink-600 dark:text-pink-400';
      case 'green': return 'text-emerald-600 dark:text-emerald-400';
      case 'white': return 'text-slate-800 dark:text-slate-200';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  const getDayLineColor = (color) => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'violet': return 'bg-purple-500';
      case 'rose': return 'bg-pink-400';
      case 'green': return 'bg-emerald-500';
      case 'white': return 'bg-slate-300 dark:bg-slate-200';
      default: return 'bg-emerald-500/50';
    }
  };

  // Calculate starting empty slots
  const startDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  
  // Calculate trailing empty slots
  const totalSlots = startDayOfWeek + calendarData.length;
  const trailingSlots = totalSlots % 7 === 0 ? 0 : 7 - (totalSlots % 7);

  return (
    <div className="text-slate-800 dark:text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-3 w-full">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handlePrevMonth}
                disabled={selectedYear === 2025 && selectedMonth === 1}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
              >
                <FiChevronLeft />
              </button>
              
              <div className="flex space-x-2">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent border-none text-2xl font-bold tracking-widest text-slate-800 dark:text-white uppercase focus:ring-0 cursor-pointer appearance-none outline-none"
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx + 1} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-base">{m}</option>
                  ))}
                </select>
                
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent border-none text-2xl font-bold tracking-widest text-slate-800 dark:text-white focus:ring-0 cursor-pointer appearance-none outline-none"
                >
                  {years.map(y => (
                    <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-base">{y}</option>
                  ))}
                </select>
              </div>
  
              <button 
                onClick={handleNextMonth}
                disabled={selectedYear === 2028 && selectedMonth === 12}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-2 mb-4 w-full">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="text-center text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Grid Container */}
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
              <FiLoader size={48} className="text-amber-500 dark:text-amber-400 animate-spin" />
              <p className="text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold">Synchronizing Calendar...</p>
            </div>
          ) : error ? (
            <div className="h-96 flex flex-col items-center justify-center text-red-500 dark:text-red-400">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 w-full">
              {/* Empty slots for start of month */}
              {[...Array(startDayOfWeek)].map((_, i) => (
                <div key={'start-' + i} className="h-24 sm:h-28 rounded-2xl bg-white/40 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/30"></div>
              ))}

              {calendarData.map((data) => {
                const isToday = systemToday.getDate() === data.day &&
                                (systemToday.getMonth() + 1) === selectedMonth &&
                                systemToday.getFullYear() === selectedYear;
                const isSelected = activeDate?.day === data.day;
                
                return (
                  <button
                    key={data.day}
                    onClick={() => setActiveDate(data)}
                    className={'h-24 sm:h-28 rounded-2xl p-2 sm:p-3 flex flex-col items-start justify-start text-left transition-all relative overflow-hidden group ' + (
                      isToday
                        ? 'bg-white dark:bg-slate-800/80 border-2 border-slate-900 dark:border-white shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                        : isSelected
                          ? 'bg-white dark:bg-slate-800/80 border-2 border-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700/60 shadow-sm shadow-slate-100/50 dark:shadow-none'
                    )}
                  >
                    <div className={'absolute left-0 top-0 bottom-0 w-1 ' + getDayLineColor(data.color)}></div>
                    
                    <span className={'text-sm sm:text-base font-bold mb-1 ml-2 ' + (isSelected || isToday ? 'text-amber-500 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200')}>
                      {data.day}
                    </span>
                    
                    <span className={'text-[9px] sm:text-[10px] font-bold leading-tight ml-2 tracking-wide line-clamp-3 ' + getDayTextColor(data.color)}>
                      {data.title}
                    </span>
                  
                  {data.type !== 'Ordinary Time' && data.type !== 'Advent' && data.type !== 'Lent' && data.type !== 'Easter' && data.type !== 'Christmas' && data.type !== 'Feria' && (
                    <span className="text-[7px] sm:text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold absolute bottom-2 left-3">
                      {data.type}
                    </span>
                  )}
                  </button>
                );
              })}
              
              {/* Empty slots for end of grid */}
              {[...Array(trailingSlots)].map((_, i) => (
                 <div key={'end-' + i} className="h-24 sm:h-28 rounded-2xl bg-white/40 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/30"></div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Active Details */}
        <div className="w-full lg:col-span-1 flex flex-col">
          {activeDate ? (
            <>
              <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase mb-2">
                  {new Date(selectedYear, selectedMonth - 1, activeDate.day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase whitespace-pre-line leading-snug">
                  {activeDate.title}
                </h2>
                {activeDate.allEvents && activeDate.allEvents.length > 1 && (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 space-y-2">
                    <p className="font-bold uppercase tracking-wider text-[9px] text-slate-400 dark:text-slate-500">Liturgical Celebrations of the Day</p>
                    <div className="space-y-1.5">
                      {activeDate.allEvents.map((evt, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${
                            evt.color === 'red' ? 'bg-red-500' :
                            evt.color === 'violet' ? 'bg-purple-500' :
                            evt.color === 'green' ? 'bg-emerald-500' :
                            evt.color === 'rose' ? 'bg-pink-400' :
                            evt.color === 'white' ? 'bg-slate-400 dark:bg-slate-200' : 'bg-slate-400'
                          }`}></span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{evt.title}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">{evt.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm shadow-slate-100/50 dark:shadow-none">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-2 h-2 rounded-sm bg-amber-500 dark:bg-amber-400"></div>
                    <h3 className="text-amber-600 dark:text-amber-400 font-bold tracking-widest text-xs uppercase">Verse of the Day</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed italic font-serif">
                    {activeDate.verse}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm shadow-slate-100/50 dark:shadow-none">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-2 h-2 rounded-sm bg-slate-400"></div>
                    <h3 className="text-purple-600 dark:text-purple-400 font-bold tracking-widest text-xs uppercase">Daily Reflection</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {activeDate.reflection}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <p>Select a date to view details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
