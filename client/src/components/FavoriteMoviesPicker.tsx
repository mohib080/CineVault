import React, { useState } from 'react';
import { Plus, X, Search, Star } from 'lucide-react';
import { FavoriteMovie, Movie, api } from '../services/api';

interface FavoriteMoviesPickerProps {
  favorites: FavoriteMovie[];
  isOwner: boolean;
  onUpdate: () => void;
  onSelectMovie?: (movie: Movie) => void;
}

export const FavoriteMoviesPicker: React.FC<FavoriteMoviesPickerProps> = ({
  favorites,
  isOwner,
  onUpdate,
  onSelectMovie
}) => {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.searchMovies(q);
      setSearchResults(res.results.slice(0, 6));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMovie = async (movie: Movie) => {
    if (activeSlot === null) return;
    const currentFavs = [...favorites];
    const existingIdx = currentFavs.findIndex((f) => f.slot === activeSlot);

    if (existingIdx !== -1) {
      currentFavs[existingIdx] = {
        slot: activeSlot,
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        release_year: movie.release_year,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        director: movie.director,
        rating: movie.rating
      };
    } else {
      currentFavs.push({
        slot: activeSlot,
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        release_year: movie.release_year,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        director: movie.director,
        rating: movie.rating
      });
    }

    try {
      await api.updateUserFavorites(
        currentFavs.map((f) => ({ slot: f.slot, tmdb_id: f.tmdb_id }))
      );
      setActiveSlot(null);
      setSearchQuery('');
      setSearchResults([]);
      onUpdate();
    } catch (err) {
      console.error('Failed to update favorites:', err);
    }
  };

  const handleRemoveSlot = async (slotNum: number) => {
    const updated = favorites.filter((f) => f.slot !== slotNum);
    try {
      await api.updateUserFavorites(
        updated.map((f) => ({ slot: f.slot, tmdb_id: f.tmdb_id }))
      );
      onUpdate();
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const slots = [1, 2, 3, 4];

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={18} color="var(--accent-gold)" fill="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Favorite Films
          </h3>
        </div>
        {isOwner && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Click an empty slot to choose your Top 4
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem'
        }}
      >
        {slots.map((slotNum) => {
          const item = favorites.find((f) => f.slot === slotNum);

          if (item) {
            const posterUrl = item.poster_path
              ? item.poster_path.startsWith('http')
                ? item.poster_path
                : `https://image.tmdb.org/t/p/w400${item.poster_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';

            return (
              <div
                key={slotNum}
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  aspectRatio: '2/3',
                  boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 179, 53, 0.18)',
                  border: '1px solid rgba(245, 179, 53, 0.35)',
                  background: 'var(--bg-card)',
                  cursor: onSelectMovie ? 'pointer' : 'default',
                  transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  e.currentTarget.style.boxShadow = '0 16px 40px -4px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 179, 53, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(245, 179, 53, 0.35)';
                  e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 179, 53, 0.18)';
                }}
                onClick={() => {
                  if (onSelectMovie) {
                    onSelectMovie({
                      tmdb_id: item.tmdb_id,
                      title: item.title,
                      release_year: item.release_year,
                      poster_path: item.poster_path,
                      backdrop_path: item.backdrop_path,
                      director: item.director,
                      rating: item.rating
                    });
                  }
                }}
              >
                <img
                  src={posterUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSlot(slotNum);
                    }}
                    title="Remove from favorites"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1.25rem 0.6rem 0.5rem',
                    background: 'linear-gradient(to top, rgba(13,17,23,0.95), transparent)',
                    color: '#fff'
                  }}
                >
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </p>
                  {item.release_year && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.release_year}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // Empty Slot
          return (
            <div
              key={slotNum}
              onClick={() => {
                if (isOwner) {
                  setActiveSlot(slotNum);
                }
              }}
              style={{
                borderRadius: 'var(--radius-md)',
                aspectRatio: '2/3',
                border: isOwner ? '2px dashed var(--border-glow)' : '1px dashed var(--border-subtle)',
                background: 'rgba(255,255,255,0.015)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isOwner ? 'pointer' : 'default',
                color: 'var(--text-muted)',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              {isOwner ? (
                <>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={20} color="var(--accent-gold)" />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Slot {slotNum}</span>
                </>
              ) : (
                <span style={{ fontSize: '0.8rem' }}>Empty Slot</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Select Movie Modal for Active Slot */}
      {activeSlot !== null && (
        <div className="modal-overlay" onClick={() => setActiveSlot(null)} style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            style={{ maxWidth: 500, width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Choose Favorite #{activeSlot}</h3>
              <button
                onClick={() => setActiveSlot(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="nav-search" style={{ maxWidth: '100%', marginBottom: '1rem' }}>
                <Search size={16} className="nav-search-icon" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search film title..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
                {searchResults.map((m) => {
                  const posterUrl = m.poster_path
                    ? m.poster_path.startsWith('http')
                      ? m.poster_path
                      : `https://image.tmdb.org/t/p/w200${m.poster_path}`
                    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';

                  return (
                    <div
                      key={m.tmdb_id}
                      onClick={() => handleAssignMovie(m)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.65rem',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        border: '1px solid var(--border-subtle)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img src={posterUrl} alt={m.title} style={{ width: 36, height: 54, borderRadius: 4, objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{m.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.release_year} {m.director ? `• Directed by ${m.director}` : ''}
                        </span>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                        Select
                      </button>
                    </div>
                  );
                })}

                {searchResults.length === 0 && (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {searchQuery ? (loading ? 'Searching...' : 'No films found.') : 'Type a movie title above.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
