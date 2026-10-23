import React from 'react';
import { Movie } from '../services/api';
import { Plus } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onLogClick?: (movie: Movie) => void;
  onClick?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onLogClick, onClick }) => {
  const posterUrl = movie.poster_path
    ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

  return (
    <div className="movie-card" onClick={() => onClick && onClick(movie)}>
      <div className="movie-poster-wrap">
        <img src={posterUrl} alt={movie.title} className="movie-poster" loading="lazy" />
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
              fontSize: '0.78rem'
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
