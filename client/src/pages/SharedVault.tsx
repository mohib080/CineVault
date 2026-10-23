import React, { useState, useEffect } from 'react';
import { DiaryEntry, MovieList, Movie, api } from '../services/api';
import { RatingStars } from '../components/RatingStars';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { ShieldCheck, ShieldAlert, Calendar, RotateCcw, Film, User, ArrowLeft } from 'lucide-react';

interface SharedVaultProps {
  type: 'r' | 'l'; // 'r' for review, 'l' for list
  id: number;
  token?: string;
  onGoHome: () => void;
}

export const SharedVault: React.FC<SharedVaultProps> = ({ type, id, token, onGoHome }) => {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [list, setList] = useState<MovieList | null>(null);
  const [listItems, setListItems] = useState<(Movie & { rank_order: number; notes: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (type === 'r') {
          const res = await api.getDiaryEntry(id, token);
          setEntry(res.entry);
        } else {
          const res = await api.getList(id, token);
          setList(res.list);
          setListItems(res.items);
        }
      } catch (err: any) {
        setError(err.message || 'Access Denied. Secret token invalid or entry is private.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, id, token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-muted)' }}>
        Decrypting secret vault entry...
      </div>
    );
  }

  if (error || (!entry && !list)) {
    return (
      <div className="reader-container" style={{ textAlign: 'center', maxWidth: 540 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--priv-private-bg)', border: '1px solid var(--priv-private-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--priv-private-text)' }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Vault Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          {error || 'This entity is either set to PRIVATE by its owner or the secret share token provided in the URL has expired or is invalid.'}
        </p>
        <button onClick={onGoHome} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to CineVault Home
        </button>
      </div>
    );
  }

  // 1. Shared Review / Diary Log View
  if (type === 'r' && entry) {
    const posterUrl = entry.poster_path
      ? (entry.poster_path.startsWith('http') ? entry.poster_path : `https://image.tmdb.org/t/p/w500${entry.poster_path}`)
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

    return (
      <div className="reader-container">
        {/* Token verified badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 229, 255, 0.12)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            color: 'var(--accent-cyan)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}
        >
          <ShieldCheck size={14} /> Verified Secret Vault Link
        </div>

        <div className="reader-header">
          <img src={posterUrl} alt={entry.title || 'Movie'} className="reader-poster" />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Diary Log by <strong style={{ color: 'var(--text-main)' }}>@{entry.username || 'Vault Member'}</strong>
              </span>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {entry.title || 'Untitled Film'}
              </h1>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {entry.release_year ? `${entry.release_year} • ` : ''}
                {entry.director ? `Directed by ${entry.director}` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
              <RatingStars value={entry.rating} readOnly size={22} />
              <PrivacyBadge visibility={entry.visibility} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> Watched {typeof entry.watched_date === 'string' ? entry.watched_date.split('T')[0] : ''}
              </span>
              {Boolean(entry.is_rewatch) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)' }}>
                  <RotateCcw size={13} /> Rewatch
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Review body */}
        {entry.review_text ? (
          <div style={{ fontSize: '1.08rem', lineHeight: 1.8, color: '#e2e8f0', whiteSpace: 'pre-wrap', fontStyle: 'normal' }}>
            {entry.review_text}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No written review was attached to this log.
          </p>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onGoHome} className="btn btn-secondary">
            <ArrowLeft size={15} /> Explore CineVault
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Protected by CineVault Granular Privacy
          </span>
        </div>
      </div>
    );
  }

  // 2. Shared List View
  if (type === 'l' && list) {
    return (
      <div className="reader-container" style={{ maxWidth: 960 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 229, 255, 0.12)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            color: 'var(--accent-cyan)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}
        >
          <ShieldCheck size={14} /> Verified Secret Vault Link
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800 }}>{list.title}</h1>
            <PrivacyBadge visibility={list.visibility} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Curated by <strong style={{ color: 'var(--text-main)' }}>@{list.username || 'Vault Member'}</strong> • {listItems.length} films
          </p>
          {list.description && (
            <p style={{ marginTop: '0.75rem', color: '#cbd5e1', lineHeight: 1.6, maxWidth: 700 }}>
              {list.description}
            </p>
          )}
        </div>

        {/* List items grid */}
        <div className="movie-grid">
          {listItems.map((item) => {
            const posterUrl = item.poster_path
              ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w400${item.poster_path}`)
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';

            return (
              <div key={item.tmdb_id} className="movie-card">
                <div className="movie-poster-wrap">
                  <img src={posterUrl} alt={item.title} className="movie-poster" />
                </div>
                <div className="movie-card-info">
                  <h4 className="movie-card-title">{item.title}</h4>
                  <div className="movie-card-meta">
                    <span>{item.release_year || '—'}</span>
                    <span>{item.director || ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onGoHome} className="btn btn-secondary">
            <ArrowLeft size={15} /> Explore CineVault
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Protected by CineVault Granular Privacy
          </span>
        </div>
      </div>
    );
  }

  return null;
};
