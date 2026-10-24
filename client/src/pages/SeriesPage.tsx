import React, { useState, useEffect } from 'react';
import { Movie, Genre, api } from '../services/api';
import { MovieCard } from '../components/MovieCard';
import { TrailerModal } from '../components/TrailerModal';
import {
  Tv,
  Flame,
  Trophy,
  CalendarDays,
  Sparkles,
  Loader2,
  Filter,
  Radio
} from 'lucide-react';

interface SeriesPageProps {
  onLogMovie: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
}

const TV_GENRES: Genre[] = [
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 80, name: 'Crime' },
  { id: 35, name: 'Comedy' },
  { id: 16, name: 'Animation' },
  { id: 9648, name: 'Mystery' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 99, name: 'Documentary' }
];

const DECADES = [
  { label: 'All Decades', value: 0 },
  { label: '2024–2025 (Current)', value: 2024 },
  { label: '2020–2023', value: 2022 },
  { label: '2010s', value: 2015 },
  { label: '2000s', value: 2005 },
  { label: '1990s', value: 1995 }
];

export const SeriesPage: React.FC<SeriesPageProps> = ({ onLogMovie, onSelectMovie }) => {
  const [series, setSeries] = useState<Movie[]>([]);
  const [category, setCategory] = useState<'trending' | 'popular' | 'top_rated' | 'airing'>('popular');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);

  const handleOpenTrailer = async (movie: Movie) => {
    if (movie.trailer_key) {
      setActiveTrailer({ key: movie.trailer_key, title: movie.title });
      return;
    }
    try {
      const res = await api.getMovieDetail(movie.tmdb_id, 'series');
      if (res.movie?.trailer_key) {
        setActiveTrailer({ key: res.movie.trailer_key, title: res.movie.title });
      } else {
        onSelectMovie(movie);
      }
    } catch {
      onSelectMovie(movie);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    async function loadSeries() {
      setLoading(true);
      try {
        const res = await api.discoverMovies(
          category,
          1,
          selectedGenre || undefined,
          selectedYear || undefined,
          'series'
        );
        if (isCurrent) {
          setSeries(res.results);
          setPage(1);
          setTotalPages(res.total_pages);
        }
      } catch (err) {
        console.warn('Series page discover error:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadSeries();
    return () => {
      isCurrent = false;
    };
  }, [category, selectedGenre, selectedYear]);

  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await api.discoverMovies(
        category,
        nextPage,
        selectedGenre || undefined,
        selectedYear || undefined,
        'series'
      );
      setSeries((prev) => {
        const existingIds = new Set(prev.map((m) => m.tmdb_id));
        const newOnes = res.results.filter((m) => !existingIds.has(m.tmdb_id));
        return [...prev, ...newOnes];
      });
      setPage(nextPage);
    } catch (err) {
      console.warn('Load more series error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="content-container">
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 16, 32, 0.92) 0%, rgba(6, 7, 10, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.08)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 420,
            height: 420,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 840 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              color: '#c084fc',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '0.9rem'
            }}
          >
            <Tv size={14} /> Prestige Television Universe
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.8rem',
              fontWeight: 900,
              letterSpacing: '-0.8px',
              color: '#ffffff',
              lineHeight: 1.15
            }}
          >
            Series
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              marginTop: '0.65rem',
              lineHeight: 1.6
            }}
          >
            Immerse yourself in binge-worthy television sagas, critically acclaimed mini-series, and streaming phenomena from Netflix, HBO, Apple TV+, and beyond.
          </p>
        </div>
      </div>

      {/* 2. Category Tabs & Decade Filter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Category Segmented Control */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 4,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            gap: 4
          }}
        >
          <button
            onClick={() => setCategory('popular')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: category === 'popular' ? '#ffffff' : 'transparent',
              color: category === 'popular' ? '#06070a' : 'var(--text-muted)'
            }}
          >
            Popular Sagas
          </button>

          <button
            onClick={() => setCategory('trending')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: category === 'trending' ? '#ffffff' : 'transparent',
              color: category === 'trending' ? '#06070a' : 'var(--text-muted)'
            }}
          >
            Trending This Week
          </button>

          <button
            onClick={() => setCategory('top_rated')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: category === 'top_rated' ? '#ffffff' : 'transparent',
              color: category === 'top_rated' ? '#06070a' : 'var(--text-muted)'
            }}
          >
            Critically Acclaimed
          </button>

          <button
            onClick={() => setCategory('airing')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: category === 'airing' ? '#ffffff' : 'transparent',
              color: category === 'airing' ? '#06070a' : 'var(--text-muted)'
            }}
          >
            Airing Now
          </button>
        </div>

        {/* Decade / Year Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={selectedYear || 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setSelectedYear(val === 0 ? null : val);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {DECADES.map((d) => (
              <option key={d.value} value={d.value} style={{ background: '#0e1118', color: '#fff' }}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Sliding TV Genre Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
          scrollbarWidth: 'none'
        }}
      >
        <button
          onClick={() => setSelectedGenre(null)}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            background: selectedGenre === null ? '#c084fc' : 'rgba(255, 255, 255, 0.05)',
            color: selectedGenre === null ? '#000000' : 'var(--text-secondary)',
            border: selectedGenre === null ? 'none' : '1px solid var(--border-subtle)'
          }}
        >
          All Genres
        </button>

        {TV_GENRES.map((g) => {
          const isSelected = selectedGenre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(isSelected ? null : g.id)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#000000' : 'var(--text-secondary)',
                border: isSelected ? 'none' : '1px solid var(--border-subtle)'
              }}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      {/* 4. Series Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '6rem 1rem', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="spin" style={{ margin: '0 auto 1rem', color: '#c084fc' }} />
          <p>Curating television broadcasts & streaming archives...</p>
        </div>
      ) : series.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 1rem', color: 'var(--text-muted)' }}>
          <h3>No series found</h3>
          <p style={{ marginTop: '0.5rem' }}>Try clearing the genre or decade filter.</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
              gap: '14px'
            }}
          >
            {series.map((show) => (
              <MovieCard
                key={`series-${show.tmdb_id}`}
                movie={{ ...show, title_type: 'series' }}
                onLogClick={onLogMovie}
                onTrailerClick={handleOpenTrailer}
                onClick={onSelectMovie}
              />
            ))}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
              <button
                className="btn-bb-secondary"
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{ padding: '0.75rem 2.8rem', fontSize: '0.94rem' }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="spin" /> Loading Episodes...
                  </>
                ) : (
                  'Load More Television Series'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Trailer Modal */}
      {activeTrailer && (
        <TrailerModal
          trailerKey={activeTrailer.key}
          title={activeTrailer.title}
          onClose={() => setActiveTrailer(null)}
        />
      )}
    </div>
  );
};
