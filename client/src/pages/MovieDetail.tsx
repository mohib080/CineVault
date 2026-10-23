import React, { useState, useEffect } from 'react';
import { Movie, DiaryEntry, api } from '../services/api';
import { RatingStars } from '../components/RatingStars';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar, User, Film, Plus, ArrowLeft } from 'lucide-react';

interface MovieDetailProps {
  tmdbId: number;
  onBack: () => void;
  onLogMovie: (movie: Movie) => void;
}

export const MovieDetail: React.FC<MovieDetailProps> = ({ tmdbId, onBack, onLogMovie }) => {
  const { user } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userLogs, setUserLogs] = useState<DiaryEntry[]>([]);
  const [communityLogs, setCommunityLogs] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getMovieDetail(tmdbId);
        setMovie(res.movie);
        setUserLogs(res.userLogs || []);
        setCommunityLogs(res.communityLogs || []);
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tmdbId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Retrieving movie metadata...</div>;
  }

  if (!movie) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Movie not found.</p>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Browse
        </button>
      </div>
    );
  }

  const posterUrl = movie.poster_path
    ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

  const backdropUrl = movie.backdrop_path
    ? (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`)
    : null;

  return (
    <div>
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
        <ArrowLeft size={15} /> Back
      </button>

      {/* Backdrop & Header Banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          border: '1px solid var(--border-subtle)',
          background: backdropUrl
            ? `linear-gradient(to top, rgba(10, 13, 18, 0.95) 15%, rgba(10, 13, 18, 0.6) 80%), url(${backdropUrl}) center/cover no-repeat`
            : 'var(--bg-card)',
          padding: '2.5rem'
        }}
      >
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={posterUrl}
            alt={movie.title}
            style={{
              width: 220,
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              boxShadow: 'var(--shadow-poster)'
            }}
          />

          <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.15 }}>
              {movie.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {movie.release_year && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} /> {movie.release_year}
                </span>
              )}
              {movie.runtime && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={15} /> {movie.runtime} min
                </span>
              )}
              {movie.director && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={15} /> Directed by {movie.director}
                </span>
              )}
            </div>

            {movie.overview && (
              <p style={{ color: '#d0d7de', fontSize: '1.02rem', lineHeight: 1.6, maxWidth: 720 }}>
                {movie.overview}
              </p>
            )}

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => onLogMovie(movie)}
                className="btn btn-gold"
                style={{ padding: '0.65rem 1.4rem' }}
              >
                <Plus size={16} /> Log This Film to Vault
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User's Personal Log History for this movie */}
      {user && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Film size={18} color="var(--accent-cyan)" /> Your Personal Logs for "{movie.title}"
          </h2>

          {userLogs.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              You haven't logged this film yet. Click "Log This Film to Vault" above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <RatingStars value={log.rating} readOnly size={16} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Watched {typeof log.watched_date === 'string' ? log.watched_date.split('T')[0] : ''}
                      </span>
                    </div>
                    <PrivacyBadge visibility={log.visibility} />
                  </div>

                  {log.review_text && (
                    <p style={{ fontSize: '0.92rem', color: '#cfd8dc', whiteSpace: 'pre-wrap' }}>
                      {log.review_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community Public Reviews */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>
          Community Public Reviews
        </h2>

        {communityLogs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No public reviews logged yet for this film. Be the first to share your thoughts publicly!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {communityLogs.map((rev) => (
              <div
                key={rev.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--accent-cyan)' }}>
                    @{rev.username}
                  </span>
                  <RatingStars value={rev.rating} readOnly size={14} />
                </div>
                {rev.review_text && (
                  <p style={{ fontSize: '0.88rem', color: '#b0bec5', lineHeight: 1.5 }}>
                    {rev.review_text}
                  </p>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 'auto' }}>
                  {typeof rev.watched_date === 'string' ? rev.watched_date.split('T')[0] : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
