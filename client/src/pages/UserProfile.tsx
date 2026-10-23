import React, { useState, useEffect } from 'react';
import { DiaryEntry, MovieList, api } from '../services/api';
import { RatingStars } from '../components/RatingStars';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { User, Film, List, Calendar, Award } from 'lucide-react';

interface UserProfileProps {
  username: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ username }) => {
  const [profileData, setProfileData] = useState<{
    user: { id: number; username: string; created_at: string; isOwner: boolean };
    stats: {
      totalFilms: number;
      avgRating: string;
      rewatchCount: number;
      listsCount: number;
    };
    entries: DiaryEntry[];
    lists: MovieList[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'diary' | 'lists'>('diary');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getUserProfile(username);
        setProfileData(res);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading profile...</div>;
  }

  if (!profileData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>User not found</h2>
      </div>
    );
  }

  const { user, stats, entries, lists } = profileData;

  return (
    <div>
      {/* Profile Header */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5ff 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 800,
              fontSize: '1.8rem'
            }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{user.username}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Joined {typeof user.created_at === 'string' ? user.created_at.split('T')[0] : 'Recently'} • {user.isOwner ? <span style={{ color: 'var(--accent-cyan)' }}>Viewing your own profile</span> : 'Public Profile'}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.totalFilms}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Films</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{stats.avgRating}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Rating</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{stats.rewatchCount}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rewatches</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.listsCount}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lists</span>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setTab('diary')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: tab === 'diary' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: tab === 'diary' ? '2px solid var(--accent-cyan)' : 'none'
          }}
        >
          Diary Logs ({entries.length})
        </button>
        <button
          onClick={() => setTab('lists')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: tab === 'lists' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: tab === 'lists' ? '2px solid var(--accent-cyan)' : 'none'
          }}
        >
          Curated Lists ({lists.length})
        </button>
      </div>

      {tab === 'diary' ? (
        entries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            No visible diary entries.
          </p>
        ) : (
          <div className="diary-timeline">
            {entries.map((entry) => {
              const posterUrl = entry.poster_path
                ? (entry.poster_path.startsWith('http') ? entry.poster_path : `https://image.tmdb.org/t/p/w200${entry.poster_path}`)
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';

              return (
                <div key={entry.id} className="diary-item-card">
                  <img src={posterUrl} alt={entry.title || 'Movie'} className="diary-item-poster" />
                  <div className="diary-item-content">
                    <div className="diary-item-header">
                      <div>
                        <div className="diary-item-title">
                          <span>{entry.title}</span>
                          <span className="diary-item-year">({entry.release_year})</span>
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          <RatingStars value={entry.rating} readOnly size={16} />
                        </div>
                      </div>
                      <PrivacyBadge visibility={entry.visibility} />
                    </div>

                    {entry.review_text && (
                      <p className="diary-item-review" style={{ margin: '0.5rem 0' }}>
                        {entry.review_text}
                      </p>
                    )}

                    <div className="diary-item-footer">
                      <span>Watched on {typeof entry.watched_date === 'string' ? entry.watched_date.split('T')[0] : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : lists.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          No visible lists found.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {lists.map((l) => (
            <div key={l.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{l.title}</h4>
                <PrivacyBadge visibility={l.visibility} />
              </div>
              {l.description && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>{l.description}</p>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{l.item_count || 0} movies</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
