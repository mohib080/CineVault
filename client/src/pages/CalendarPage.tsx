import React, { useState, useEffect } from 'react';
import { DiaryEntry, Movie, api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Star,
  Film,
  Lock,
  Link2,
  Globe,
  Sparkles,
  ArrowRight,
  X,
  Plus
} from 'lucide-react';

interface CalendarPageProps {
  onSelectMovie: (movie: Movie) => void;
  onOpenLogModal?: (movie: Movie) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onSelectMovie,
  onOpenLogModal,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation: default to current month
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayEntries, setSelectedDayEntries] = useState<{ dateStr: string; entries: DiaryEntry[] } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  useEffect(() => {
    if (user) {
      setLoading(true);
      api
        .getMyDiary()
        .then((res) => {
          setEntries(res.entries || []);
        })
        .catch(() => setEntries([]))
        .finally(() => setLoading(false));
    } else {
      // Demo entries for unauthenticated guests
      setEntries([
        {
          id: 901,
          user_id: 1,
          tmdb_id: 693134,
          title: 'Dune: Part Two',
          release_year: 2024,
          poster_path: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
          director: 'Denis Villeneuve',
          runtime: 166,
          rating: 4.5,
          review_text: 'Breathtaking cinema. The sound design and scale on Arrakis are unmatched.',
          visibility: 'PUBLIC',
          is_rewatch: false,
          contains_spoilers: false,
          share_token: null,
          watched_date: new Date(new Date().getFullYear(), new Date().getMonth(), 4).toISOString().split('T')[0],
          created_at: new Date().toISOString()
        },
        {
          id: 902,
          user_id: 1,
          tmdb_id: 872585,
          title: 'Oppenheimer',
          release_year: 2023,
          poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
          director: 'Christopher Nolan',
          runtime: 180,
          rating: 5.0,
          review_text: 'A masterclass in tension and moral catastrophe. Cillian Murphy gave the performance of a lifetime.',
          visibility: 'PUBLIC',
          is_rewatch: false,
          contains_spoilers: false,
          share_token: null,
          watched_date: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString().split('T')[0],
          created_at: new Date().toISOString()
        },
        {
          id: 903,
          user_id: 1,
          tmdb_id: 157336,
          title: 'Interstellar',
          release_year: 2014,
          poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
          director: 'Christopher Nolan',
          runtime: 169,
          rating: 5.0,
          review_text: 'Rewatched for the 10th time. The docking scene still makes my heart pound.',
          visibility: 'PRIVATE',
          is_rewatch: true,
          contains_spoilers: false,
          share_token: null,
          watched_date: new Date(new Date().getFullYear(), new Date().getMonth(), 19).toISOString().split('T')[0],
          created_at: new Date().toISOString()
        },
        {
          id: 904,
          user_id: 1,
          tmdb_id: 81356,
          title: 'Sex Education',
          release_year: 2019,
          poster_path: '/bc3bmTdnoKcRuO9xdQKgAbB7Y9Z.jpg',
          director: 'Laurie Nunn',
          runtime: 55,
          rating: 4.5,
          review_text: 'Finished Season 2! The character growth and humor are top tier.',
          visibility: 'UNLISTED',
          is_rewatch: false,
          contains_spoilers: false,
          share_token: 'demo-token-unlisted',
          watched_date: new Date(new Date().getFullYear(), new Date().getMonth(), 24).toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }
  }, [user]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter entries for the displayed month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEntries = entries.filter((e) => {
    const d = e.watched_date || e.created_at?.split('T')[0];
    return d && d.startsWith(monthPrefix);
  });

  // Calculate monthly stats
  const totalMonthFilms = monthEntries.length;
  const totalMinutes = monthEntries.reduce((acc, e) => acc + (Number(e.runtime) || 110), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const ratedEntries = monthEntries.filter((e) => e.rating !== null && e.rating !== undefined);
  const avgMonthRating =
    ratedEntries.length > 0
      ? (ratedEntries.reduce((acc, e) => acc + Number(e.rating), 0) / ratedEntries.length).toFixed(1)
      : '—';

  // Group entries by day number
  const entriesByDay: Record<number, DiaryEntry[]> = {};
  for (const entry of monthEntries) {
    const d = entry.watched_date || entry.created_at?.split('T')[0];
    if (d) {
      const dayNum = parseInt(d.split('-')[2], 10);
      if (!entriesByDay[dayNum]) entriesByDay[dayNum] = [];
      entriesByDay[dayNum].push(entry);
    }
  }

  return (
    <div className="content-container">
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 20, 30, 0.95) 0%, rgba(6, 7, 10, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.2rem 2rem',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(245, 179, 53, 0.12)',
                border: '1px solid rgba(245, 179, 53, 0.35)',
                color: 'var(--accent-gold)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '0.75rem'
              }}
            >
              <CalendarDays size={14} /> Cinema Diary Timeline
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.6rem',
                fontWeight: 900,
                letterSpacing: '-0.8px',
                color: '#ffffff',
                lineHeight: 1.15
              }}
            >
              Screening Calendar
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
              Your day-by-day cinematic history. Visualized by date of screening with ratings and reviews.
            </p>
          </div>

          {!user && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                maxWidth: 320
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                Guest Preview Mode
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 10 }}>
                Sign in to log screenings onto your personal calendar and build your watching diary.
              </p>
              <button
                className="btn-bb-primary"
                onClick={() => onOpenAuth('login')}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
              >
                Sign in to Track
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Monthly Stats Bento Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div className="bento-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Films This Month</span>
            <Film size={15} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>
            {totalMonthFilms}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Logged in {monthNames[month]}
          </span>
        </div>

        <div className="bento-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Screening Time</span>
            <Clock size={15} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>
            {totalHours} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total runtime watched
          </span>
        </div>

        <div className="bento-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Average Rating</span>
            <Star size={15} fill="var(--accent-gold)" color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>
            {avgMonthRating} {avgMonthRating !== '—' && <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5</span>}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            For {monthNames[month]} entries
          </span>
        </div>
      </div>

      {/* 3. Month Navigation & View Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Month Arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button className="bb-arrow-btn" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <button className="bb-arrow-btn" onClick={handleNextMonth} title="Next Month">
              <ChevronRight size={18} />
            </button>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.3px'
            }}
          >
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={handleToday}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)'
            }}
          >
            Today
          </button>
        </div>

        {/* View Switcher: Grid vs Timeline */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 3,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            gap: 4
          }}
        >
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: viewMode === 'grid' ? '#ffffff' : 'transparent',
              color: viewMode === 'grid' ? '#06070a' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            Calendar Grid
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: viewMode === 'timeline' ? '#ffffff' : 'transparent',
              color: viewMode === 'timeline' ? '#06070a' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            Chronological Timeline
          </button>
        </div>
      </div>

      {/* 4. Calendar Month Grid View */}
      {viewMode === 'grid' ? (
        <div
          style={{
            background: 'rgba(14, 16, 22, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            overflowX: 'auto',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Days of week header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '0.65rem',
              marginBottom: '0.65rem',
              textAlign: 'center'
            }}
          >
            {daysOfWeek.map((day) => (
              <div
                key={day}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '0.65rem'
            }}
          >
            {/* Empty offset days before month start */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                style={{
                  minHeight: 125,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.01)',
                  opacity: 0.3
                }}
              />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayEntries = entriesByDay[dayNum] || [];
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (dayEntries.length > 0) {
                      const dateStr = `${monthNames[month]} ${dayNum}, ${year}`;
                      setSelectedDayEntries({ dateStr, entries: dayEntries });
                    }
                  }}
                  style={{
                    minHeight: 125,
                    borderRadius: 'var(--radius-md)',
                    background: dayEntries.length > 0 ? 'rgba(20, 24, 34, 0.9)' : 'rgba(255, 255, 255, 0.02)',
                    border: isToday
                      ? '1px solid var(--accent-gold)'
                      : dayEntries.length > 0
                      ? '1px solid rgba(0, 229, 255, 0.3)'
                      : '1px solid var(--border-subtle)',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: dayEntries.length > 0 ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    boxShadow: dayEntries.length > 0 ? '0 4px 14px rgba(0, 0, 0, 0.5)' : 'none'
                  }}
                >
                  {/* Top Day Number Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isToday ? 800 : 600,
                        color: isToday ? 'var(--accent-gold)' : dayEntries.length > 0 ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      {dayNum}
                    </span>

                    {dayEntries.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)',
                          background: 'rgba(0, 229, 255, 0.1)',
                          padding: '1px 5px',
                          borderRadius: 4
                        }}
                      >
                        {dayEntries.length} {dayEntries.length === 1 ? 'film' : 'films'}
                      </span>
                    )}
                  </div>

                  {/* Day Poster Previews */}
                  {dayEntries.length > 0 ? (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', alignItems: 'center' }}>
                      {dayEntries.slice(0, 2).map((e) => {
                        const poster = e.poster_path
                          ? e.poster_path.startsWith('http')
                            ? e.poster_path
                            : `https://image.tmdb.org/t/p/w154${e.poster_path}`
                          : null;

                        return (
                          <div key={e.id} style={{ position: 'relative' }}>
                            {poster ? (
                              <img
                                src={poster}
                                alt={e.title}
                                style={{
                                  width: 44,
                                  height: 64,
                                  borderRadius: 4,
                                  objectFit: 'cover',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                                  border: '1px solid rgba(255,255,255,0.1)'
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 44,
                                  height: 64,
                                  borderRadius: 4,
                                  background: '#1a202c',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Film size={16} color="var(--accent-gold)" />
                              </div>
                            )}

                            {e.rating && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: 2,
                                  right: 2,
                                  background: 'rgba(0,0,0,0.85)',
                                  color: 'var(--accent-gold)',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '1px 3px',
                                  borderRadius: 2
                                }}
                              >
                                ★{e.rating}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {dayEntries.length > 2 && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.06)',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          +{dayEntries.length - 2}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ flex: 1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 5. Chronological Screening Timeline View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {monthEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              <h3>No screenings recorded in {monthNames[month]} {year}</h3>
              <p style={{ marginTop: '0.5rem' }}>Log a film to start your screening timeline.</p>
            </div>
          ) : (
            monthEntries
              .sort((a, b) => (b.watched_date || b.created_at || '').localeCompare(a.watched_date || a.created_at || ''))
              .map((entry) => {
                const posterUrl = entry.poster_path
                  ? entry.poster_path.startsWith('http')
                    ? entry.poster_path
                    : `https://image.tmdb.org/t/p/w200${entry.poster_path}`
                  : null;

                return (
                  <div
                    key={`timeline-${entry.id}`}
                    className="bento-card"
                    style={{
                      display: 'flex',
                      gap: '1.25rem',
                      alignItems: 'center',
                      padding: '1.25rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      onSelectMovie({
                        tmdb_id: entry.tmdb_id,
                        title: entry.title || 'Movie',
                        release_year: entry.release_year,
                        poster_path: entry.poster_path,
                        backdrop_path: entry.backdrop_path,
                        director: entry.director,
                        runtime: entry.runtime
                      });
                    }}
                  >
                    {posterUrl && (
                      <img
                        src={posterUrl}
                        alt={entry.title}
                        style={{ width: 68, height: 100, borderRadius: 6, objectFit: 'cover' }}
                      />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--accent-gold)',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {entry.watched_date || entry.created_at?.split('T')[0]}
                        </span>
                        {entry.is_rewatch && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(255,255,255,0.08)',
                              padding: '1px 6px',
                              borderRadius: 4
                            }}
                          >
                            Rewatch
                          </span>
                        )}
                        {entry.visibility && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 2,
                              color:
                                entry.visibility === 'PRIVATE'
                                  ? 'var(--priv-private-text)'
                                  : entry.visibility === 'UNLISTED'
                                  ? 'var(--priv-unlisted-text)'
                                  : 'var(--priv-public-text)'
                            }}
                          >
                            {entry.visibility === 'PRIVATE' && <Lock size={10} />}
                            {entry.visibility === 'UNLISTED' && <Link2 size={10} />}
                            {entry.visibility === 'PUBLIC' && <Globe size={10} />}
                            {entry.visibility}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                        {entry.title} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({entry.release_year})</span>
                      </h3>

                      {entry.director && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Directed by {entry.director}
                        </div>
                      )}

                      {entry.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.4rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                          <Star size={14} fill="var(--accent-gold)" />
                          <span>{entry.rating} / 5</span>
                        </div>
                      )}

                      {entry.review_text && (
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                          "{entry.review_text}"
                        </p>
                      )}
                    </div>

                    <ArrowRight size={18} color="var(--text-dim)" />
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* 6. Day Screening Detail Modal */}
      {selectedDayEntries && (
        <div className="modal-overlay" onClick={() => setSelectedDayEntries(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 600, width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                  Screenings on {selectedDayEntries.dateStr}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedDayEntries.entries.length} {selectedDayEntries.entries.length === 1 ? 'title logged' : 'titles logged'}
                </span>
              </div>
              <button onClick={() => setSelectedDayEntries(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedDayEntries.entries.map((entry) => {
                const posterUrl = entry.poster_path
                  ? entry.poster_path.startsWith('http')
                    ? entry.poster_path
                    : `https://image.tmdb.org/t/p/w200${entry.poster_path}`
                  : null;

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem'
                    }}
                  >
                    {posterUrl && (
                      <img
                        src={posterUrl}
                        alt={entry.title}
                        style={{ width: 65, height: 98, borderRadius: 6, objectFit: 'cover' }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                          {entry.title} <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>({entry.release_year})</span>
                        </h4>

                        {entry.rating && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--accent-gold)', fontWeight: 800, fontSize: '0.85rem' }}>
                            <Star size={13} fill="var(--accent-gold)" />
                            {entry.rating}
                          </span>
                        )}
                      </div>

                      {entry.director && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Dir. {entry.director}
                        </div>
                      )}

                      {entry.review_text && (
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.45rem', fontStyle: 'italic' }}>
                          "{entry.review_text}"
                        </p>
                      )}

                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-bb-primary"
                          onClick={() => {
                            setSelectedDayEntries(null);
                            onSelectMovie({
                              tmdb_id: entry.tmdb_id,
                              title: entry.title || 'Movie',
                              release_year: entry.release_year,
                              poster_path: entry.poster_path,
                              backdrop_path: entry.backdrop_path,
                              director: entry.director,
                              runtime: entry.runtime
                            });
                          }}
                          style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
