import React, { useState, useEffect } from 'react';
import { Movie, Genre, api } from '../services/api';
import { MovieCard } from '../components/MovieCard';
import { TrailerModal } from '../components/TrailerModal';
import {
  Shield,
  Sparkles,
  Lock,
  Link2,
  Globe,
  Search,
  Flame,
  Trophy,
  CalendarDays,
  Star,
  Filter,
  Loader2,
  ArrowRight,
  Plus,
  Play
} from 'lucide-react';

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
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);

  const handleWatchSpotlightTrailer = async (movie: Movie) => {
    if (movie.trailer_key) {
      setActiveTrailer({ key: movie.trailer_key, title: movie.title });
      return;
    }
    try {
      const res = await api.getMovieDetail(movie.tmdb_id);
      if (res.movie?.trailer_key) {
        setActiveTrailer({ key: res.movie.trailer_key, title: res.movie.title });
      } else {
        onSelectMovie(movie);
      }
    } catch {
      onSelectMovie(movie);
    }
  };

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

          {/* Privacy Architecture Bento Grid */}
          <div className="privacy-bento-grid">
            <div className="privacy-bento-card card-private">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--priv-private-bg)', border: '1px solid var(--priv-private-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--priv-private-text)' }}>
                  <Lock size={18} />
                </div>
                <span className="badge-privacy PRIVATE">Private</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem' }}>Owner-Only Eyes</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Completely secluded diary entries and reviews visible only to you. Keep your rawest critiques and personal watch dates 100% confidential.
              </p>
            </div>

            <div className="privacy-bento-card card-unlisted">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--priv-unlisted-bg)', border: '1px solid var(--priv-unlisted-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--priv-unlisted-text)' }}>
                  <Link2 size={18} />
                </div>
                <span className="badge-privacy UNLISTED">Unlisted</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem' }}>Cryptographic URL</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Invisible from search engines and community streams. Share individual reviews with selected friends via unique, tamper-proof token links.
              </p>
            </div>

            <div className="privacy-bento-card card-public">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--priv-public-bg)', border: '1px solid var(--priv-public-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--priv-public-text)' }}>
                  <Globe size={18} />
                </div>
                <span className="badge-privacy PUBLIC">Public</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem' }}>CineVault Network</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Broadcasted to the public CineVault feed and your Letterboxd-style profile. Foster cinephile discussions and contribute to community ratings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Featured Spotlight Banner (Discovery Mode) */}
      {!searchQuery && movies.length > 0 && page === 1 && (
        (() => {
          const spotlight = movies[0];
          const backdrop = spotlight.backdrop_path
            ? (spotlight.backdrop_path.startsWith('http') ? spotlight.backdrop_path : `https://image.tmdb.org/t/p/original${spotlight.backdrop_path}`)
            : null;
          const poster = spotlight.poster_path
            ? (spotlight.poster_path.startsWith('http') ? spotlight.poster_path : `https://image.tmdb.org/t/p/w500${spotlight.poster_path}`)
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

          return (
            <div
              className="hero-spotlight-banner"
              style={{
                position: 'relative',
                backgroundImage: backdrop
                  ? `linear-gradient(to right, rgba(6, 8, 12, 0.98) 25%, rgba(6, 8, 12, 0.85) 60%, rgba(6, 8, 12, 0.4) 100%), url(${backdrop})`
                  : 'linear-gradient(135deg, #10151f 0%, #06080c 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '2.5rem 2.25rem',
                minHeight: '320px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div
                className="spotlight-content"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2.5rem',
                  width: '100%',
                  zIndex: 2
                }}
              >
                <div
                  className="spotlight-poster"
                  style={{
                    width: 170,
                    aspectRatio: '2/3',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 229, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    flexShrink: 0,
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectMovie(spotlight)}
                >
                  <img
                    src={poster}
                    alt={spotlight.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'linear-gradient(135deg, rgba(245, 179, 53, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
                        color: 'var(--accent-gold)',
                        border: '1px solid rgba(245, 179, 53, 0.4)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px'
                      }}
                    >
                      <Flame size={13} /> Featured Spotlight
                    </span>
                    {(spotlight.vote_average || spotlight.rating) && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(245, 179, 53, 0.3)',
                          color: 'var(--accent-gold)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      >
                        <Star size={13} fill="var(--accent-gold)" /> {(spotlight.vote_average || spotlight.rating)?.toFixed(1)} TMDB
                      </span>
                    )}
                    {spotlight.release_year && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {spotlight.release_year}
                      </span>
                    )}
                  </div>

                  <h2
                    onClick={() => onSelectMovie(spotlight)}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.2rem',
                      fontWeight: 800,
                      lineHeight: 1.2,
                      cursor: 'pointer',
                      marginBottom: '0.75rem',
                      color: '#ffffff'
                    }}
                  >
                    {spotlight.title}
                  </h2>

                  {spotlight.overview && (
                    <p
                      style={{
                        color: '#c9d1d9',
                        fontSize: '0.96rem',
                        lineHeight: 1.6,
                        maxWidth: 720,
                        marginBottom: '1.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {spotlight.overview}
                    </p>
                  )}

                  <div className="spotlight-actions" style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => onLogMovie(spotlight)}
                      className="btn btn-gold"
                      style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
                    >
                      <Plus size={16} /> Quick Log to Vault
                    </button>
                    <button
                      onClick={() => handleWatchSpotlightTrailer(spotlight)}
                      className="btn btn-secondary"
                      style={{ padding: '0.65rem 1.3rem', fontSize: '0.9rem', gap: '0.45rem' }}
                    >
                      <Play size={15} fill="#fff" /> Watch Trailer
                    </button>
                    <button
                      onClick={() => onSelectMovie(spotlight)}
                      className="btn btn-secondary"
                      style={{ padding: '0.65rem 1.3rem', fontSize: '0.9rem', gap: '0.45rem' }}
                    >
                      View Details & Cast <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Discovery Navigation & Controls */}
      {!searchQuery && (
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Category Tabs - Sliding Pill Dock */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(10, 14, 22, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                flexWrap: 'wrap',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
              }}
            >
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
                      padding: '0.5rem 1.15rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isActive ? 'var(--accent-gold-gradient)' : 'transparent',
                      color: isActive ? '#050a12' : 'var(--text-muted)',
                      border: 'none',
                      boxShadow: isActive ? '0 2px 14px var(--accent-gold-glow)' : 'none',
                      transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
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
                  background: 'rgba(10, 14, 22, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)',
                  padding: '0.5rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
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
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: selectedGenre === null ? 'rgba(0, 229, 255, 0.18)' : 'rgba(10, 14, 22, 0.75)',
                border: selectedGenre === null ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                color: selectedGenre === null ? '#fff' : 'var(--text-muted)',
                boxShadow: selectedGenre === null ? '0 0 12px rgba(0, 229, 255, 0.25)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
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
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isSelected ? 'rgba(0, 229, 255, 0.18)' : 'rgba(10, 14, 22, 0.75)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: isSelected ? '#fff' : 'var(--text-muted)',
                    boxShadow: isSelected ? '0 0 12px rgba(0, 229, 255, 0.25)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
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
