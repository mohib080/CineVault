import React, { useState } from 'react';
import { Movie } from '../services/api';
import { Plus, Film, Star, Tv, Play, ArrowUpRight, Lock, Link2, Globe } from 'lucide-react';

interface MovieCardProps {
  movie: Movie & { rating?: number; vote_average?: number; visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' };
  onLogClick?: (movie: Movie) => void;
  onTrailerClick?: (movie: Movie) => void;
  onClick?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onLogClick, onTrailerClick, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasPoster = Boolean(movie.poster_path && movie.poster_path.trim() !== '');
  const posterUrl = hasPoster
    ? (movie.poster_path!.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : null;

  const isSeries = movie.title_type === 'series' || movie.overview?.includes('[TV Series]');
  const score = movie.vote_average || movie.rating;

  return (
    <div
      className="bb-movie-card"
      onClick={() => onClick && onClick(movie)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bb-movie-poster-wrap">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="bb-movie-poster"
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(145deg, #181d26 0%, #0d1017 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.25rem 0.85rem'
            }}
          >
            <div>
              {isSeries ? <Tv size={22} color="var(--accent-gold)" /> : <Film size={22} color="var(--accent-cyan)" />}
            </div>

            <div>
              <h5
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  lineHeight: 1.3,
                  color: '#f0f4f8',
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
              CineVault
            </div>
          </div>
        )}

        {/* Ambient Top Badges */}
        <div className="bb-card-top-badges">
          {/* Format or Privacy Badge */}
          {movie.visibility ? (
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontFamily: 'var(--font-mono)',
                backdropFilter: 'blur(8px)',
                background:
                  movie.visibility === 'PRIVATE'
                    ? 'var(--priv-private-bg)'
                    : movie.visibility === 'UNLISTED'
                    ? 'var(--priv-unlisted-bg)'
                    : 'var(--priv-public-bg)',
                color:
                  movie.visibility === 'PRIVATE'
                    ? 'var(--priv-private-text)'
                    : movie.visibility === 'UNLISTED'
                    ? 'var(--priv-unlisted-text)'
                    : 'var(--priv-public-text)',
                border: `1px solid ${
                  movie.visibility === 'PRIVATE'
                    ? 'var(--priv-private-border)'
                    : movie.visibility === 'UNLISTED'
                    ? 'var(--priv-unlisted-border)'
                    : 'var(--priv-public-border)'
                }`
              }}
            >
              {movie.visibility === 'PRIVATE' && <Lock size={10} />}
              {movie.visibility === 'UNLISTED' && <Link2 size={10} />}
              {movie.visibility === 'PUBLIC' && <Globe size={10} />}
              {movie.visibility}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: isSeries ? 'rgba(245, 179, 53, 0.92)' : 'rgba(10, 14, 22, 0.85)',
                color: isSeries ? '#000' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                border: isSeries ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {isSeries ? 'Series' : 'Film'}
            </span>
          )}

          {/* Rating Pill */}
          {score && (
            <span className="bb-card-rating">
              <Star size={10} fill="var(--accent-gold)" />
              <span>{score.toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Hover Action Overlay with BingeBang Circular Buttons */}
        <div className="bb-card-hover-overlay">
          <div className="bb-card-quick-actions">
            {onLogClick && (
              <button
                type="button"
                className="bb-circle-btn btn-gold"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogClick(movie);
                }}
                title="Log this film to your Vault"
              >
                <Plus size={16} strokeWidth={2.8} />
              </button>
            )}

            {onTrailerClick && (
              <button
                type="button"
                className="bb-circle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrailerClick(movie);
                }}
                title="Watch Trailer"
              >
                <Play size={14} fill="#ffffff" />
              </button>
            )}

            <button
              type="button"
              className="bb-circle-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(movie);
              }}
              title="View Film Details"
            >
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Below Poster */}
      <div className="bb-card-info">
        <h4 className="bb-card-title" title={movie.title}>
          {movie.title}
        </h4>
        <div className="bb-card-meta">
          <span>{movie.release_year || '—'}</span>
          {movie.director && (
            <span
              style={{
                maxWidth: '95px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)'
              }}
              title={movie.director}
            >
              {movie.director}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
