import React, { useRef, useCallback, useEffect } from 'react';
import { Movie } from '../services/api';
import { Plus, Film, Star, Tv, Play, ArrowUpRight, Lock, Link2, Globe } from 'lucide-react';

interface MovieCardProps {
  movie: Movie & { rating?: number; vote_average?: number; visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' };
  onLogClick?: (movie: Movie) => void;
  onTrailerClick?: (movie: Movie) => void;
  onClick?: (movie: Movie) => void;
}

const MAX_TILT = 12; // Degrees
const HOVER_SCALE = 1.05;

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onLogClick, onTrailerClick, onClick }) => {
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const hasPoster = Boolean(movie.poster_path && movie.poster_path.trim() !== '');
  const posterUrl = hasPoster
    ? (movie.poster_path!.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : null;

  const isSeries = movie.title_type === 'series' || movie.overview?.includes('[TV Series]');
  const score = movie.vote_average || movie.rating;

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const updateFromPoint = useCallback((clientX: number, clientY: number) => {
    if (!cardWrapRef.current) return;
    const rect = cardWrapRef.current.getBoundingClientRect();

    const px = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const py = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    const rotY = ((px - 50) / 50) * MAX_TILT;
    const rotX = ((py - 50) / 50) * -MAX_TILT;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const card = cardWrapRef.current;
      if (!card) return;
      card.style.setProperty('--pointer-x', `${px.toFixed(1)}%`);
      card.style.setProperty('--pointer-y', `${py.toFixed(1)}%`);
      card.style.setProperty('--rotate-x', `${rotX.toFixed(2)}deg`);
      card.style.setProperty('--rotate-y', `${rotY.toFixed(2)}deg`);
      card.style.setProperty('--card-scale', `${HOVER_SCALE}`);
    });
  }, []);

  const resetTilt = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const card = cardWrapRef.current;
      if (!card) return;
      card.style.setProperty('--rotate-x', '0deg');
      card.style.setProperty('--rotate-y', '0deg');
      card.style.setProperty('--card-scale', '1');
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updateFromPoint(e.clientX, e.clientY);
  }, [updateFromPoint]);

  const handleMouseLeave = useCallback(() => {
    resetTilt();
  }, [resetTilt]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) updateFromPoint(touch.clientX, touch.clientY);
  }, [updateFromPoint]);

  return (
    <div
      className="bb-movie-card"
      onClick={() => onClick && onClick(movie)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetTilt}
    >
      <div className="bb-movie-poster-wrap" ref={cardWrapRef}>
        {/* Dynamic Specular Light Sheen */}
        <div className="bb-card-sheen" />

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

        {/* 3D Floating Top Badges */}
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

        {/* 3D Elevated Hover Action Overlay */}
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
