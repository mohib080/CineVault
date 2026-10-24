import React, { useState, useEffect } from 'react';
import { Movie, Genre, api } from '../services/api';
import { MovieCard } from '../components/MovieCard';
import { TrailerModal } from '../components/TrailerModal';
import {
  Film,
  Flame,
  Trophy,
  CalendarDays,
  Sparkles,
  Loader2,
  Filter,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface MoviesPageProps {
  onLogMovie: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
}

const MOVIE_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }
];

const DECADES = [
  { label: 'All Decades', value: 0 },
  { label: '2024–2025 (Current)', value: 2024 },
  { label: '2020–2023', value: 2022 },
  { label: '2010s', value: 2015 },
  { label: '2000s', value: 2005 },
  { label: '1990s', value: 1995 },
  { label: '1980s', value: 1985 },
  { label: '1970s (Golden Age)', value: 1975 }
];

export const MoviesPage: React.FC<MoviesPageProps> = ({ onLogMovie, onSelectMovie }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [category, setCategory] = useState<'trending' | 'popular' | 'top_rated' | 'upcoming'>('popular');
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
      const res = await api.getMovieDetail(movie.tmdb_id, 'movie');
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
    async function loadMovies() {
      setLoading(true);
      try {
        const res = await api.discoverMovies(
          category,
          1,
          selectedGenre || undefined,
          selectedYear || undefined,
          'movie'
        );
        if (isCurrent) {
          setMovies(res.results);
          setPage(1);
          setTotalPages(res.total_pages);
        }
      } catch (err) {
        console.warn('Movies page discover error:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadMovies();
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
        'movie'
      );
      setMovies((prev) => {
        const existingIds = new Set(prev.map((m) => m.tmdb_id));
        const newOnes = res.results.filter((m) => !existingIds.has(m.tmdb_id));
        return [...prev, ...newOnes];
      });
      setPage(nextPage);
    } catch (err) {
      console.warn('Load more movies error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="content-container">
      {/* 1. Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 18, 26, 0.9) 0%, rgba(6, 7, 10, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 840 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              color: 'var(--accent-cyan)',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '0.9rem'
            }}
          >
            <Film size={14} /> Feature Film Catalogue
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
            Movies
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              marginTop: '0.65rem',
              lineHeight: 1.6
            }}
          >
            Browse theatrical masterworks, upcoming festival selections, and award-winning cinematic releases from over 850,000 indexed titles.
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
            Popular
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
            Top Rated
          </button>

          <button
            onClick={() => setCategory('upcoming')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: category === 'upcoming' ? '#ffffff' : 'transparent',
              color: category === 'upcoming' ? '#06070a' : 'var(--text-muted)'
            }}
          >
            In Theaters
          </button>
        </div>

        {/* Decade Dropdown */}
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

      {/* 3. Sliding Genre Pills */}
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
            background: selectedGenre === null ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
            color: selectedGenre === null ? '#000000' : 'var(--text-secondary)',
            border: selectedGenre === null ? 'none' : '1px solid var(--border-subtle)'
          }}
        >
          All Genres
        </button>

        {MOVIE_GENRES.map((g) => {
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
                background: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#000000' : 'var(--text-secondary)',
                border: isSelected ? 'none' : '1px solid var(--border-subtle)'
              }}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      {/* 4. Film Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '6rem 1rem', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-cyan)' }} />
          <p>Curating cinema collection...</p>
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 1rem', color: 'var(--text-muted)' }}>
          <h3>No films found</h3>
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
            {movies.map((movie) => (
              <MovieCard
                key={`movie-${movie.tmdb_id}`}
                movie={movie}
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
                    <Loader2 size={16} className="spin" /> Loading Films...
                  </>
                ) : (
                  'Load More Feature Films'
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
