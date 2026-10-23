import React, { useState, useEffect } from 'react';
import { DiaryEntry, api } from '../services/api';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { RatingStars } from '../components/RatingStars';
import { ShareModal } from '../components/ShareModal';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  RotateCcw,
  AlertTriangle,
  Share2,
  Trash2,
  Eye,
  EyeOff,
  BarChart2,
  Filter,
  Plus
} from 'lucide-react';

interface DashboardProps {
  onQuickLog: () => void;
  onEditEntry: (entry: DiaryEntry) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onQuickLog, onEditEntry }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('ALL');
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});
  const [shareModalItem, setShareModalItem] = useState<{ id: number; token: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.getMyDiary(filter);
      setEntries(res.entries);
    } catch (err) {
      console.error('Failed to fetch diary entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filter]);

  const handleToggleVisibility = async (id: number, nextVisibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE') => {
    try {
      const res = await api.updateDiaryVisibility(id, nextVisibility);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, visibility: res.entry.visibility, share_token: res.entry.share_token } : e))
      );
      showToast(`Privacy updated to ${nextVisibility}`);
      if (nextVisibility === 'UNLISTED' && res.entry.share_token) {
        setShareModalItem({
          id,
          token: res.entry.share_token,
          title: entries.find((e) => e.id === id)?.title || 'Movie Log'
        });
      }
    } catch (err: any) {
      alert(`Error updating visibility: ${err.message}`);
    }
  };

  const handleDelete = async (id: number, title?: string) => {
    if (!confirm(`Are you sure you want to remove your log for "${title || 'this movie'}" from your vault?`)) {
      return;
    }
    try {
      await api.deleteDiaryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast('Entry removed from vault');
    } catch (err: any) {
      alert(`Failed to delete entry: ${err.message}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics calculation
  const totalLogs = entries.length;
  const rewatches = entries.filter((e) => Boolean(e.is_rewatch)).length;
  const ratings = entries.filter((e) => e.rating !== null).map((e) => Number(e.rating));
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';

  // Distribution chart data: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]
  const ratingSteps = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  const distribution: Record<number, number> = {};
  ratingSteps.forEach((s) => (distribution[s] = 0));
  ratings.forEach((r) => {
    const rounded = Math.round(r * 2) / 2;
    if (distribution[rounded] !== undefined) distribution[rounded]++;
  });
  const maxCount = Math.max(1, ...Object.values(distribution));

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Share Modal for UNLISTED items */}
      {shareModalItem && (
        <ShareModal
          type="r"
          id={shareModalItem.id}
          shareToken={shareModalItem.token}
          title={shareModalItem.title}
          onClose={() => setShareModalItem(null)}
        />
      )}

      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
            My Personal Vault
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Logged as <strong>{user?.username}</strong> • Default privacy: <strong style={{ color: 'var(--accent-cyan)' }}>{user?.default_privacy}</strong>
          </p>
        </div>

        <button onClick={onQuickLog} className="btn btn-gold">
          <Plus size={16} /> Log Another Film
        </button>
      </div>

      {/* Analytics & Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Films Logged</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{totalLogs}</h2>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Rating</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.25rem' }}>
            {avgRating} {avgRating !== '—' && <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5.0</span>}
          </h2>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rewatches</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>{rewatches}</h2>
        </div>

        {/* Mini Rating Distribution Chart */}
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rating Spread
            </span>
            <BarChart2 size={14} color="var(--accent-gold)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 44, gap: 4 }}>
            {ratingSteps.map((step) => {
              const count = distribution[step] || 0;
              const heightPct = count > 0 ? Math.max(15, (count / maxCount) * 100) : 6;
              return (
                <div
                  key={step}
                  title={`${step} Stars: ${count} films`}
                  style={{
                    flex: 1,
                    height: `${heightPct}%`,
                    background: count > 0 ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '2px 2px 0 0',
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <Filter size={15} /> <span>Filter by Visibility:</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['ALL', 'PUBLIC', 'UNLISTED', 'PRIVATE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.8rem',
                fontSize: '0.8rem',
                background: filter === mode ? 'var(--bg-card-hover)' : 'transparent',
                borderColor: filter === mode ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                color: filter === mode ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Entries */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Accessing encrypted vault logs...
        </div>
      ) : entries.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
            No vault entries found for filter: <strong>{filter}</strong>
          </p>
          <button onClick={onQuickLog} className="btn btn-primary">
            <Plus size={16} /> Log Your First Film
          </button>
        </div>
      ) : (
        <div className="diary-timeline">
          {entries.map((entry) => {
            const posterUrl = entry.poster_path
              ? (entry.poster_path.startsWith('http') ? entry.poster_path : `https://image.tmdb.org/t/p/w200${entry.poster_path}`)
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';

            const isSpoiler = Boolean(entry.contains_spoilers);
            const isSpoilerShown = revealedSpoilers[entry.id];

            return (
              <div key={entry.id} className="diary-item-card">
                <img src={posterUrl} alt={entry.title || 'Poster'} className="diary-item-poster" />

                <div className="diary-item-content">
                  <div className="diary-item-header">
                    <div>
                      <div className="diary-item-title">
                        <span>{entry.title || 'Untitled Film'}</span>
                        <span className="diary-item-year">({entry.release_year || '—'})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.25rem' }}>
                        <RatingStars value={entry.rating} readOnly size={16} />
                        {Boolean(entry.is_rewatch) && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              color: 'var(--accent-cyan)',
                              background: 'rgba(0, 229, 255, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 4
                            }}
                          >
                            <RotateCcw size={11} /> Rewatch
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Privacy Badge & One-Click Visibility Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <PrivacyBadge visibility={entry.visibility} />

                      {/* Dropdown 1-click toggle */}
                      <select
                        value={entry.visibility}
                        onChange={(e) => handleToggleVisibility(entry.id, e.target.value as any)}
                        style={{
                          background: 'var(--bg-input)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.5rem',
                          cursor: 'pointer'
                        }}
                        title="Change Privacy Visibility"
                      >
                        <option value="PRIVATE">🔒 Private</option>
                        <option value="UNLISTED">🔗 Unlisted</option>
                        <option value="PUBLIC">🌐 Public</option>
                      </select>
                    </div>
                  </div>

                  {/* Review Text with Spoiler handling */}
                  {entry.review_text && (
                    <div style={{ margin: '0.5rem 0' }}>
                      {isSpoiler && !isSpoilerShown ? (
                        <div
                          onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [entry.id]: true }))}
                          style={{
                            background: 'rgba(245, 179, 53, 0.08)',
                            border: '1px dashed rgba(245, 179, 53, 0.3)',
                            padding: '0.6rem 0.9rem',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--accent-gold)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <AlertTriangle size={15} />
                          <span>This review contains spoilers. Click to reveal.</span>
                        </div>
                      ) : (
                        <p className="diary-item-review">{entry.review_text}</p>
                      )}
                    </div>
                  )}

                  {/* Footer & Actions */}
                  <div className="diary-item-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={13} />
                      <span>Watched on {typeof entry.watched_date === 'string' ? entry.watched_date.split('T')[0] : 'Recent'}</span>
                    </div>

                    <div className="diary-item-actions">
                      {/* Copy Secret Vault Link for UNLISTED items */}
                      {entry.visibility === 'UNLISTED' && entry.share_token && (
                        <button
                          type="button"
                          onClick={() =>
                            setShareModalItem({
                              id: entry.id,
                              token: entry.share_token!,
                              title: entry.title || 'Movie Log'
                            })
                          }
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.78rem',
                            color: 'var(--accent-cyan)',
                            borderColor: 'rgba(0, 229, 255, 0.3)'
                          }}
                          title="Copy Secret Vault Share Link"
                        >
                          <Share2 size={13} /> Copy Secret Vault Link
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id, entry.title)}
                        className="btn btn-danger"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
