import React, { useState } from 'react';
import { X, Film } from 'lucide-react';
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

  const posterUrl = movie.poster_path
    ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w300${movie.poster_path}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Film size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {initialEntry ? 'Edit Diary Entry' : 'Log Movie to Vault'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
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
                {movie.director ? `Directed by ${movie.director}` : ''}
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

          {/* Rating */}
          <div className="form-group">
            <label>Rating (supports half-stars)</label>
            <RatingStars value={rating} onChange={setRating} size={24} />
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
            <label>Review & Personal Notes</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="What did you think of the cinematography, score, performances..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
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
              <span>I've seen this film before (Rewatch)</span>
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

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-gold">
              {loading ? 'Saving...' : initialEntry ? 'Update Entry' : 'Log to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
