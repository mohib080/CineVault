import React, { useState, useEffect } from 'react';
import { Movie, Genre, api } from '../services/api';
import { MovieCard } from '../components/MovieCard';
import { Shield, Sparkles, Lock, Link2, Globe, Search, Flame, Trophy, CalendarDays, Star, Filter, Loader2 } from 'lucide-react';

interface HomeProps {
  onLogMovie: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  searchQuery: string;
  onClearSearch?: () => void;
}

const STANDARD_GENRES: Genre[] = [
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
  { label: '2024–2025', value: 2024 },
  { label: '2020–2023', value: 2022 },
  { label: '2010s', value: 2015 },
  { label: '2000s', value: 2005 },
  { label: '1990s', value: 1995 },
  { label: '1980s', value: 1985 },
  { label: '1970s', value: 1975 }
];

export const Home: React.FC<HomeProps> = ({ onLogMovie, onSelectMovie, searchQuery, onClearSearch }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [category, setCategory] = useState<'trending' | 'popular' | 'top_rated' | 'upcoming'>('trending');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load discovery or search results
  useEffect(() => {
    let isCurrent = true;

    async function loadMovies() {
      if (searchQuery.trim()) {
        setLoading(true);
        try {
          const res = await api.searchMovies(searchQuery);
          if (isCurrent) {
            setMovies(res.results);
            setTotalPages(1);
            setPage(1);
          }
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          if (isCurrent) setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await api.discoverMovies(category, 1, selectedGenre || undefined, selectedYear || undefined);
        if (isCurrent) {
          setMovies(res.results);
          setTotalPages(res.total_pages);
          setPage(1);
        }
      } catch (err) {
        console.error('Discover error:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadMovies();

    return () => {
      isCurrent = false;
    };
  }, [searchQuery, category, selectedGenre, selectedYear]);

  // Load More pagination
  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await api.discoverMovies(category, nextPage, selectedGenre || undefined, selectedYear || undefined);
      setMovies((prev) => {
        const existingIds = new Set(prev.map((m) => m.tmdb_id));
        const newOnes = res.results.filter((m) => !existingIds.has(m.tmdb_id));
        return [...prev, ...newOnes];
      });
      setPage(nextPage);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load more films:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      {/* Hero section */}
      {!searchQuery && (
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 1rem 3.5rem',
            position: 'relative'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}
          >
            <Shield size={14} /> Granular 3-Tier Privacy Architecture
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3.2rem',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              lineHeight: 1.15,
              marginBottom: '1.25rem'
            }}
          >
            The Movie Diary Built For <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #00e5ff 0%, #f5b335 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Absolute Privacy Control
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-muted)',
              maxWidth: 640,
              margin: '0 auto 2rem'
            }}
          >
            Log films, pen reviews, and curate watchlists with total discretion. Toggle effortlessly between
            <strong> Private</strong>, <strong>Unlisted</strong> cryptographic share links, and <strong>Public</strong> feeds.
          </p>

          {/* Privacy demo badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--priv-private-bg)', border: '1px solid var(--priv-private-border)', color: 'var(--priv-private-text)', padding: '0.4rem 0.85rem', borderRadius: 20, fontSize: '0.85rem' }}>
              <Lock size={14} /> <strong>Private:</strong> Owner-Only Eyes
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--priv-unlisted-bg)', border: '1px solid var(--priv-unlisted-border)', color: 'var(--priv-unlisted-text)', padding: '0.4rem 0.85rem', borderRadius: 20, fontSize: '0.85rem' }}>
              <Link2 size={14} /> <strong>Unlisted:</strong> Secret Token URL
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--priv-public-bg)', border: '1px solid var(--priv-public-border)', color: 'var(--priv-public-text)', padding: '0.4rem 0.85rem', borderRadius: 20, fontSize: '0.85rem' }}>
              <Globe size={14} /> <strong>Public:</strong> CineVault Network
            </div>
          </div>
        </div>
      )}

      {/* Discovery Navigation & Controls */}
      {!searchQuery && (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'trending', label: 'Trending This Week', icon: Flame },
                { id: 'popular', label: 'Popular Cinema', icon: Star },
                { id: 'top_rated', label: 'Top Rated All Time', icon: Trophy },
                { id: 'upcoming', label: 'Anticipated & Upcoming', icon: CalendarDays }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategory(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isActive ? 'var(--accent-gold)' : 'transparent',
                      color: isActive ? '#000' : 'var(--text-muted)',
                      border: isActive ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Decade Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                value={selectedYear || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedYear(val === 0 ? null : val);
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {DECADES.map((d) => (
                  <option key={d.label} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
            <button
              onClick={() => setSelectedGenre(null)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: selectedGenre === null ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-input)',
                border: selectedGenre === null ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                color: selectedGenre === null ? 'var(--accent-cyan)' : 'var(--text-muted)'
              }}
            >
              All Genres
            </button>
            {STANDARD_GENRES.map((g) => {
              const isSelected = selectedGenre === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenre(isSelected ? null : g.id)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isSelected ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-input)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'
                  }}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Movies Grid Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {searchQuery ? (
              <>
                <Search size={20} color="var(--accent-cyan)" /> Results for "{searchQuery}"
              </>
            ) : (
              <>
                <Sparkles size={20} color="var(--accent-gold)" />
                {category === 'trending'
                  ? 'Trending Films'
                  : category === 'top_rated'
                  ? 'Top Rated Films'
                  : category === 'upcoming'
                  ? 'Upcoming Releases'
                  : 'Popular Cinema'}
              </>
            )}
          </h2>
          {searchQuery && onClearSearch && (
            <button
              onClick={onClearSearch}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              Clear Search
            </button>
          )}
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {movies.length} films loaded
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-gold)" />
          <p style={{ color: 'var(--text-muted)' }}>Discovering titles...</p>
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No titles found matching your filter criteria.</p>
        </div>
      ) : (
        <>
          <div className="movie-grid">
            {movies.map((m) => (
              <MovieCard
                key={m.tmdb_id}
                movie={m}
                onLogClick={onLogMovie}
                onClick={onSelectMovie}
              />
            ))}
          </div>

          {/* Load More Pagination */}
          {!searchQuery && page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem 2.25rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Loading more...
                  </>
                ) : (
                  'Load More Films'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
