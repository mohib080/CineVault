import React, { useState } from 'react';
import { X, Film, Tv, Heart, Tag, CornerDownLeft, Loader2 } from 'lucide-react';
import { Movie, DiaryEntry, api } from '../services/api';
import { RatingStars } from './RatingStars';
import { PrivacyToggle } from './PrivacyToggle';
import { useAuth } from '../context/AuthContext';

interface LogMovieModalProps {
  movie: Movie;
  initialEntry?: DiaryEntry | null;
  onClose: () => void;
  onSuccess: (entry: DiaryEntry) => void;
}

export const LogMovieModal: React.FC<LogMovieModalProps> = ({
  movie,
  initialEntry,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();

  const [rating, setRating] = useState<number | null>(
    initialEntry ? initialEntry.rating : 4.0
  );
  const [reviewText, setReviewText] = useState(
    initialEntry ? initialEntry.review_text || '' : ''
  );
  const [watchedDate, setWatchedDate] = useState(
    initialEntry
      ? (typeof initialEntry.watched_date === 'string' ? initialEntry.watched_date.split('T')[0] : '')
      : new Date().toISOString().split('T')[0]
  );
  const [isRewatch, setIsRewatch] = useState(
    initialEntry ? Boolean(initialEntry.is_rewatch) : false
  );
  const [containsSpoilers, setContainsSpoilers] = useState(
    initialEntry ? Boolean(initialEntry.contains_spoilers) : false
  );
  const [liked, setLiked] = useState<boolean>(
    initialEntry ? Boolean(initialEntry.liked) : false
  );
  const [tags, setTags] = useState<string>(
    initialEntry ? (initialEntry.tags || '') : ''
  );
  const [visibility, setVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>(
    initialEntry ? initialEntry.visibility : (user?.default_privacy || 'PRIVATE')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialEntry) {
        // Update
        const res = await api.updateDiaryEntry(initialEntry.id, {
          rating: rating ?? undefined,
          review_text: reviewText,
          watched_date: watchedDate,
          is_rewatch: isRewatch,
          contains_spoilers: containsSpoilers,
          liked: liked,
          tags: tags,
          visibility
        });
        onSuccess(res.entry);
      } else {
        // Create new
        const res = await api.logMovie({
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          release_year: movie.release_year,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          director: movie.director,
          runtime: movie.runtime,
          overview: movie.overview,
          rating: rating ?? undefined,
          review_text: reviewText,
          watched_date: watchedDate,
          is_rewatch: isRewatch,
          contains_spoilers: containsSpoilers,
          liked: liked,
          tags: tags,
          visibility
        });
        onSuccess(res.entry);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const isSeries = movie.title_type === 'series' || movie.overview?.includes('[TV Series]');

  const posterUrl = movie.poster_path
    ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w300${movie.poster_path}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isSeries ? <Tv size={20} color="var(--accent-gold)" /> : <Film size={20} color="var(--accent-gold)" />}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {initialEntry
                ? (isSeries ? 'Edit Series Entry' : 'Edit Diary Entry')
                : (isSeries ? 'Log Series to Vault' : 'Log Movie to Vault')}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <div className="modal-body">
            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Film mini banner */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <img src={posterUrl} alt={movie.title} style={{ width: 48, height: 72, borderRadius: 4, objectFit: 'cover' }} />
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{movie.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {movie.release_year ? `${movie.release_year} • ` : ''}
                  {movie.director ? `Directed by ${movie.director}` : isSeries ? 'Television Series' : 'Feature Film'}
                </p>
              </div>
            </div>

            {/* Privacy Segments */}
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Privacy State</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Who can see this log?</span>
              </label>
              <PrivacyToggle value={visibility} onChange={setVisibility} />
            </div>

            {/* Rating & Like */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ margin: 0 }}>Rating</label>
                <button
                  type="button"
                  onClick={() => setLiked(!liked)}
                  style={{
                    background: liked ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
                    border: liked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.3rem 0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: liked ? '#ef4444' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Heart size={14} fill={liked ? '#ef4444' : 'none'} />
                  <span>{liked ? 'Liked' : 'Like'}</span>
                </button>
              </div>
              <RatingStars value={rating} onChange={setRating} size={24} />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={14} color="var(--accent-gold)" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. noir, rewatch-2024, top-scifi, 90s-cinema"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Watched Date */}
            <div className="form-group">
              <label>Date Watched</label>
              <input
                type="date"
                className="form-input"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                required
              />
            </div>

            {/* Review text */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Review & Personal Notes</label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Press <strong style={{ color: 'var(--accent-gold)' }}>Ctrl+Enter</strong> to submit
                </span>
              </div>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder={isSeries ? "What did you think of the season, episode arcs, characters..." : "What did you think of the cinematography, score, performances..."}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Your review can be public, unlisted, or private
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(245, 179, 53, 0.12)',
                    border: '1px solid rgba(245, 179, 53, 0.35)',
                    color: 'var(--accent-gold)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Save and submit your review (Ctrl+Enter)"
                >
                  <CornerDownLeft size={13} strokeWidth={2.5} />
                  <span>Enter Review</span>
                </button>
              </div>
            </div>

            {/* Checkboxes: Rewatch & Spoilers */}
            <div style={{ display: 'flex', gap: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  checked={isRewatch}
                  onChange={(e) => setIsRewatch(e.target.checked)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <span>I've seen this before (Rewatch)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  checked={containsSpoilers}
                  onChange={(e) => setContainsSpoilers(e.target.checked)}
                  style={{ accentColor: 'var(--accent-gold)' }}
                />
                <span>Contains Spoilers</span>
              </label>
            </div>
          </div>

          {/* Sticky Modal Footer - Always Visible on Screen */}
          <div className="modal-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                Ctrl
              </span>
              +
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                Enter
              </span>
              <span>to submit</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.55rem 1.15rem' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-gold"
                title="Enter and save your review to vault (Ctrl + Enter)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.35rem',
                  fontWeight: 800
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CornerDownLeft size={16} strokeWidth={2.5} />
                    <span>{initialEntry ? 'Update Entry (Enter)' : isSeries ? 'Enter & Log Series' : 'Enter & Log to Vault'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
