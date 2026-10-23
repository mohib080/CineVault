import React, { useState, useEffect } from 'react';
import { Movie, api } from '../services/api';
import { MovieCard } from '../components/MovieCard';
import { Shield, Sparkles, Lock, Link2, Globe, Search } from 'lucide-react';

interface HomeProps {
  onLogMovie: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  searchQuery: string;
}

export const Home: React.FC<HomeProps> = ({ onLogMovie, onSelectMovie, searchQuery }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (searchQuery.trim()) {
          const res = await api.searchMovies(searchQuery);
          setMovies(res.results);
        } else {
          const res = await api.getPopularMovies();
          setMovies(res.results);
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchQuery]);

  return (
    <div>
      {/* Hero section */}
      {!searchQuery && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem 4rem',
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

      {/* Movies Grid Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {searchQuery ? (
            <>
              <Search size={20} color="var(--accent-cyan)" /> Search Results for "{searchQuery}"
            </>
          ) : (
            <>
              <Sparkles size={20} color="var(--accent-gold)" /> Trending & Iconic Cinema
            </>
          )}
        </h2>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {movies.length} {movies.length === 1 ? 'film' : 'films'}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading films...
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No movies found matching "{searchQuery}".</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};
