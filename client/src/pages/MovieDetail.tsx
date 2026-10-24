import React, { useState, useEffect } from 'react';
import { Movie, DiaryEntry, api, getCachedData } from '../services/api';
import { RatingStars } from '../components/RatingStars';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { TrailerModal } from '../components/TrailerModal';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Calendar,
  User,
  Film,
  Plus,
  ArrowLeft,
  Play,
  Heart,
  Tag,
  Star,
  Sparkles
} from 'lucide-react';

interface MovieDetailProps {
  tmdbId: number;
  titleType?: string;
  onBack: () => void;
  onLogMovie: (movie: Movie) => void;
  onSelectMovie?: (movie: Movie) => void;
  onSelectPerson?: (personId: number) => void;
}

export const MovieDetail: React.FC<MovieDetailProps> = ({
  tmdbId,
  titleType,
  onBack,
  onLogMovie,
  onSelectMovie,
  onSelectPerson
}) => {
  const { user } = useAuth();

  const cacheKey = `/movies/${tmdbId}${titleType ? `?type=${encodeURIComponent(titleType)}` : ''}`;
  const initialCached = getCachedData<{ movie: Movie; userLogs: DiaryEntry[]; communityLogs: DiaryEntry[] }>(cacheKey);

  const [movie, setMovie] = useState<Movie | null>(initialCached?.movie || null);
  const [userLogs, setUserLogs] = useState<DiaryEntry[]>(initialCached?.userLogs || []);
  const [communityLogs, setCommunityLogs] = useState<DiaryEntry[]>(initialCached?.communityLogs || []);
  const [loading, setLoading] = useState(!initialCached);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    async function load() {
      if (!initialCached) {
        setLoading(true);
      }
      try {
        const res = await api.getMovieDetail(tmdbId, titleType);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tmdbId, titleType]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem', color: 'var(--text-muted)' }}>
        Retrieving cinema metadata...
      </div>
    );
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
      <button
        onClick={onBack}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Backdrop & Header Banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: backdropUrl
            ? `linear-gradient(to bottom, rgba(7, 9, 14, 0.4) 0%, rgba(7, 9, 14, 0.85) 60%, #07090e 100%), url(${backdropUrl}) center/cover no-repeat`
            : 'var(--bg-card)',
          padding: '3rem 2.5rem 2.5rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 45px rgba(0, 229, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={posterUrl}
            alt={movie.title}
            style={{
              width: 220,
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-lg)',
              objectFit: 'cover',
              boxShadow: '0 25px 50px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 229, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)',
              transition: 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.05) translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 32px 60px -8px rgba(0, 0, 0, 0.98), 0 0 45px rgba(0, 229, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateY(-4deg) rotateX(2deg)';
              e.currentTarget.style.boxShadow = '0 25px 50px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 229, 255, 0.25)';
            }}
          />

          <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.8px', color: '#fff' }}>
                {movie.title}
              </h1>
              {movie.tagline && (
                <p
                  style={{
                    color: 'var(--accent-gold)',
                    fontSize: '1.1rem',
                    fontStyle: 'italic',
                    marginTop: '0.4rem',
                    opacity: 0.95
                  }}
                >
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Meta Tags Bento Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {movie.release_year && (
                <div style={{ background: 'rgba(14, 18, 26, 0.75)', backdropFilter: 'blur(10px)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Release Year</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{movie.release_year}</span>
                </div>
              )}
              {movie.runtime && (
                <div style={{ background: 'rgba(14, 18, 26, 0.75)', backdropFilter: 'blur(10px)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Runtime</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{movie.runtime} min</span>
                </div>
              )}
              {movie.director && (
                <div style={{ background: 'rgba(14, 18, 26, 0.75)', backdropFilter: 'blur(10px)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Director</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{movie.director}</span>
                </div>
              )}
              {(movie.vote_average || movie.rating) && (
                <div style={{ background: 'rgba(245, 179, 53, 0.1)', backdropFilter: 'blur(10px)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 179, 53, 0.3)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>TMDB Rating</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                    <Star size={13} fill="var(--accent-gold)" /> {(movie.vote_average || movie.rating)?.toFixed(1)} / 10
                  </span>
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    style={{
                      background: 'rgba(0, 229, 255, 0.1)',
                      border: '1px solid rgba(0, 229, 255, 0.25)',
                      padding: '0.25rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)'
                    }}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {movie.overview && (
              <p style={{ color: '#d0d7de', fontSize: '1.02rem', lineHeight: 1.65, maxWidth: 780 }}>
                {movie.overview}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onLogMovie(movie)}
                className="btn btn-gold"
                style={{ padding: '0.7rem 1.6rem', fontSize: '0.92rem' }}
              >
                <Plus size={17} strokeWidth={2.8} /> Log This Film to Vault
              </button>

              {movie.trailer_key && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.7rem 1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.92rem'
                  }}
                >
                  <Play size={16} fill="#fff" /> Watch Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cast & Crew Carousel with Circular Avatars */}
      {movie.cast && movie.cast.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)' }}>
              <Sparkles size={18} color="var(--accent-gold)" /> Top Cast & Filmmakers
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any artist to view full filmography
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              overflowX: 'auto',
              paddingBottom: '1rem'
            }}
          >
            {movie.cast.map((actor) => {
              const photoUrl = actor.profile_path
                ? (actor.profile_path.startsWith('http')
                  ? actor.profile_path
                  : `https://image.tmdb.org/t/p/w200${actor.profile_path}`)
                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

              return (
                <div
                  key={actor.person_id}
                  onClick={() => onSelectPerson && onSelectPerson(actor.person_id)}
                  style={{
                    minWidth: 110,
                    maxWidth: 110,
                    textAlign: 'center',
                    cursor: onSelectPerson ? 'pointer' : 'default',
                    transition: 'transform 0.28s cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px) scale(1.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
                >
                  <div
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: '50%',
                      margin: '0 auto 0.6rem',
                      overflow: 'hidden',
                      border: '2px solid rgba(0, 229, 255, 0.35)',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 229, 255, 0.15)',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    <img
                      src={photoUrl}
                      alt={actor.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {actor.name}
                  </p>
                  <p
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {actor.character_name || 'Artist'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                      {Boolean(log.liked) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
                          <Heart size={14} fill="#ef4444" /> Liked
                        </span>
                      )}
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

                  {log.tags && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {log.tags.split(',').map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(0, 229, 255, 0.08)',
                            color: 'var(--accent-cyan)',
                            border: '1px solid rgba(0, 229, 255, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.15rem 0.45rem',
                            fontSize: '0.72rem'
                          }}
                        >
                          <Tag size={10} /> {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Similar Movies Row */}
      {movie.similar && movie.similar.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>
            Similar Films You Might Like
          </h2>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.75rem' }}>
            {movie.similar.map((sim) => {
              const simPoster = sim.poster_path
                ? (sim.poster_path.startsWith('http')
                  ? sim.poster_path
                  : `https://image.tmdb.org/t/p/w300${sim.poster_path}`)
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';

              return (
                <div
                  key={sim.tmdb_id}
                  onClick={() => onSelectMovie && onSelectMovie(sim)}
                  className="similar-chip-card"
                >
                  <img
                    src={simPoster}
                    alt={sim.title}
                    style={{ width: '100%', height: 215, objectFit: 'cover', transition: 'transform 0.25s ease' }}
                  />
                  <div style={{ padding: '0.6rem 0.5rem' }}>
                    <p
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {sim.title}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {sim.release_year || ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* Trailer Modal */}
      {showTrailer && movie.trailer_key && (
        <TrailerModal
          trailerKey={movie.trailer_key}
          title={movie.title}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
};
