import React, { useState } from 'react';
import { Movie } from '../services/api';
import { Plus, Film, Star, Tv, ArrowUpRight, Eye } from 'lucide-react';

interface MovieCardProps {
  movie: Movie & { rating?: number; vote_average?: number };
  onLogClick?: (movie: Movie) => void;
  onClick?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onLogClick, onClick }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const hasPoster = Boolean(movie.poster_path && movie.poster_path.trim() !== '');
  const posterUrl = hasPoster
    ? (movie.poster_path!.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : null;

  const isSeries = movie.title_type === 'series' || movie.overview?.includes('[TV Series]');
  const score = movie.vote_average || movie.rating;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 10), y: x * 10 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      className="movie-card group"
      onClick={() => onClick && onClick(movie)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: isHovered ? '1px solid rgba(0, 229, 255, 0.45)' : '1px solid var(--border-subtle)',
        boxShadow: isHovered
          ? '0 20px 45px -10px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0, 229, 255, 0.2)'
          : '0 4px 16px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${isHovered ? -5 : 0}px)`,
        transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease, border-color 0.25s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        className="movie-poster-wrap"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2/3',
          background: '#0d1117',
          overflow: 'hidden'
        }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="movie-poster"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {isSeries ? <Tv size={20} color="var(--accent-gold)" /> : <Film size={20} color="var(--accent-cyan)" />}
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

        {/* Ambient Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        >
          {/* Format Badge */}
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: isSeries ? 'rgba(245, 179, 53, 0.9)' : 'rgba(10, 14, 22, 0.82)',
              color: isSeries ? '#000' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: isSeries ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {isSeries ? 'Series' : 'Film'}
          </span>

          {/* Rating Pill */}
          {score && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(10, 14, 22, 0.85)',
                color: 'var(--accent-gold)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245, 179, 53, 0.35)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Star size={11} fill="var(--accent-gold)" />
              <span>{score.toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Dark Vignette Overlay on Bottom of Poster */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '45%',
            background: 'linear-gradient(to top, rgba(7, 9, 14, 0.95), transparent)',
            pointerEvents: 'none'
          }}
        />

        {/* Quick-Vault Interactive Action Buttons */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            zIndex: 3
          }}
        >
          {onLogClick && (
            <button
              type="button"
              className="btn-quick-log"
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'var(--accent-cyan-gradient)',
                color: '#051424',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 4px 14px rgba(0, 229, 255, 0.45)',
                cursor: 'pointer',
                border: 'none',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onLogClick(movie);
              }}
              title="Log this film to your Vault"
            >
              <Plus size={13} strokeWidth={2.8} /> Log
            </button>
          )}
        </div>
      </div>

      <div className="movie-card-info" style={{ padding: '0.75rem 0.85rem' }}>
        <h4
          className="movie-card-title"
          title={movie.title}
          style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3
          }}
        >
          {movie.title}
        </h4>
        <div
          className="movie-card-meta"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.25rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span>{movie.release_year || '—'}</span>
          {movie.director && (
            <span
              style={{
                maxWidth: '105px',
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
