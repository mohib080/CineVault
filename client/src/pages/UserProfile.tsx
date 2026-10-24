import React, { useState, useEffect } from 'react';
import { DiaryEntry, MovieList, FavoriteMovie, Movie, api } from '../services/api';
import { RatingStars } from '../components/RatingStars';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { FavoriteMoviesPicker } from '../components/FavoriteMoviesPicker';
import { Film, List, Clock, BarChart2, Award, Heart, Tag } from 'lucide-react';

interface UserProfileProps {
  username: string;
  onSelectMovie?: (movie: Movie) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ username, onSelectMovie }) => {
  const [profileData, setProfileData] = useState<{
    user: { id: number; username: string; created_at: string; isOwner: boolean };
    stats: {
      totalFilms: number;
      avgRating: string;
      rewatchCount: number;
      totalHoursWatched: number;
      topDirectors: Array<{ director: string; count: number }>;
      topGenres: Array<{ name: string; count: number }>;
      listsCount: number;
      ratingDistribution: Record<string, number>;
    };
    favorites: FavoriteMovie[];
    entries: DiaryEntry[];
    lists: MovieList[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'diary' | 'lists' | 'stats'>('diary');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getUserProfile(username);
      setProfileData(res);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
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

  const { user, stats, favorites, entries, lists } = profileData;

  const ratingSteps = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];
  const maxBarCount = Math.max(1, ...Object.values(stats.ratingDistribution || {}));

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
              Joined {typeof user.created_at === 'string' ? user.created_at.split('T')[0] : 'Recently'} •{' '}
              {user.isOwner ? (
                <span style={{ color: 'var(--accent-cyan)' }}>Viewing your own profile</span>
              ) : (
                'Public Profile'
              )}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats.totalFilms}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Films
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {stats.totalHoursWatched}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Hours
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
              {stats.avgRating}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Avg Rating
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats.listsCount}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Lists
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 Favorite Films Showcase */}
      <FavoriteMoviesPicker
        favorites={favorites || []}
        isOwner={user.isOwner}
        onUpdate={fetchProfile}
        onSelectMovie={onSelectMovie}
      />

      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setTab('diary')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: tab === 'diary' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: tab === 'diary' ? '2px solid var(--accent-cyan)' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Diary Logs ({entries.length})
        </button>
        <button
          onClick={() => setTab('stats')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: tab === 'stats' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: tab === 'stats' ? '2px solid var(--accent-cyan)' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Detailed Statistics
        </button>
        <button
          onClick={() => setTab('lists')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: tab === 'lists' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderBottom: tab === 'lists' ? '2px solid var(--accent-cyan)' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Curated Lists ({lists.length})
        </button>
      </div>

      {tab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Rating Histogram */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="var(--accent-gold)" /> Rating Distribution
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 8, padding: '0 0.5rem' }}>
              {ratingSteps.map((step) => {
                const count = stats.ratingDistribution?.[step] || 0;
                const heightPct = count > 0 ? Math.max(15, (count / maxBarCount) * 100) : 4;
                return (
                  <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', color: count > 0 ? 'var(--accent-gold)' : 'transparent', marginBottom: 4, fontWeight: 700 }}>
                      {count}
                    </span>
                    <div
                      title={`${step} Stars: ${count} films`}
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: count > 0 ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '2px 2px 0 0'
                      }}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Genres */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Film size={18} color="var(--accent-cyan)" /> Most Watched Genres
            </h3>
            {stats.topGenres && stats.topGenres.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {stats.topGenres.map((g) => (
                  <div key={g.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{g.name}</span>
                    <span style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700 }}>
                      {g.count} films
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No genre stats yet.</p>
            )}
          </div>

          {/* Top Directors */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--accent-gold)" /> Most Watched Directors
            </h3>
            {stats.topDirectors && stats.topDirectors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {stats.topDirectors.map((d) => (
                  <div key={d.director} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.director}</span>
                    <span style={{ background: 'rgba(217, 119, 6, 0.15)', color: 'var(--accent-gold)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700 }}>
                      {d.count} films
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No director stats yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'diary' && (
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
                  <img
                    src={posterUrl}
                    alt={entry.title || 'Movie'}
                    className="diary-item-poster"
                    style={{ cursor: onSelectMovie ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (onSelectMovie) {
                        onSelectMovie({
                          tmdb_id: entry.tmdb_id,
                          title: entry.title || 'Movie',
                          release_year: entry.release_year,
                          poster_path: entry.poster_path,
                          backdrop_path: entry.backdrop_path,
                          director: entry.director,
                          runtime: entry.runtime
                        });
                      }
                    }}
                  />
                  <div className="diary-item-content">
                    <div className="diary-item-header">
                      <div>
                        <div
                          className="diary-item-title"
                          style={{ cursor: onSelectMovie ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (onSelectMovie) {
                              onSelectMovie({
                                tmdb_id: entry.tmdb_id,
                                title: entry.title || 'Movie',
                                release_year: entry.release_year,
                                poster_path: entry.poster_path,
                                backdrop_path: entry.backdrop_path,
                                director: entry.director,
                                runtime: entry.runtime
                              });
                            }
                          }}
                        >
                          <span>{entry.title}</span>
                          <span className="diary-item-year">({entry.release_year})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <RatingStars value={entry.rating} readOnly size={16} />
                          {Boolean(entry.liked) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
                              <Heart size={13} fill="#ef4444" /> Liked
                            </span>
                          )}
                        </div>
                      </div>
                      <PrivacyBadge visibility={entry.visibility} />
                    </div>

                    {entry.review_text && (
                      <p className="diary-item-review" style={{ margin: '0.5rem 0' }}>
                        {entry.review_text}
                      </p>
                    )}

                    {entry.tags && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.4rem 0' }}>
                        {entry.tags.split(',').map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: 'rgba(255, 255, 255, 0.04)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.15rem 0.45rem',
                              fontSize: '0.72rem'
                            }}
                          >
                            <Tag size={10} color="var(--accent-gold)" /> {t.trim()}
                          </span>
                        ))}
                      </div>
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
      )}

      {tab === 'lists' && (
        lists.length === 0 ? (
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
        )
      )}
    </div>
  );
};
