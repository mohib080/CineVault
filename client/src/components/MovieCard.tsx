import React from 'react';
import { Movie } from '../services/api';
import { Plus, Film, Star } from 'lucide-react';

interface MovieCardProps {
  movie: Movie & { rating?: number };
  onLogClick?: (movie: Movie) => void;
  onClick?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onLogClick, onClick }) => {
  const hasPoster = Boolean(movie.poster_path && movie.poster_path.trim() !== '');
  const posterUrl = hasPoster
    ? (movie.poster_path!.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : null;

  return (
    <div className="movie-card" onClick={() => onClick && onClick(movie)}>
      <div className="movie-poster-wrap">
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} className="movie-poster" loading="lazy" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(145deg, #181d26 0%, #0d1017 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.25rem 0.85rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Film size={20} color="var(--accent-cyan)" opacity={0.8} />
              {movie.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                  <Star size={11} fill="var(--accent-gold)" />
                  <span>{movie.rating}</span>
                </div>
              )}
            </div>

            <div>
              <h5
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  lineHeight: 1.3,
                  color: '#f0f4f8',
                  letterSpacing: '-0.3px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {movie.title}
              </h5>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                {movie.release_year || 'Cinema'}
              </span>
            </div>

            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CineVault Archive
            </div>
          </div>
        )}

        {onLogClick && (
          <button
            type="button"
            className="btn btn-primary"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              zIndex: 3
            }}
            onClick={(e) => {
              e.stopPropagation();
              onLogClick(movie);
            }}
            title="Log this film to your Vault"
          >
            <Plus size={14} /> Log
          </button>
        )}
      </div>

      <div className="movie-card-info">
        <h4 className="movie-card-title" title={movie.title}>
          {movie.title}
        </h4>
        <div className="movie-card-meta">
          <span>{movie.release_year || '—'}</span>
          {movie.director && (
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={movie.director}>
              {movie.director}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
