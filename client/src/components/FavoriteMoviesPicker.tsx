import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, X, Search, Star } from 'lucide-react';
import { FavoriteMovie, Movie, api } from '../services/api';

interface FavoriteMoviesPickerProps {
  favorites: FavoriteMovie[];
  isOwner: boolean;
  onUpdate: () => void;
  onSelectMovie?: (movie: Movie) => void;
}

// 3D Tilt Card for Favorite Movie Slot
const FavoriteSlotItem: React.FC<{
  item: FavoriteMovie;
  slotNum: number;
  isOwner: boolean;
  onRemove: (slotNum: number) => void;
  onSelect?: (movie: Movie) => void;
}> = ({ item, slotNum, isOwner, onRemove, onSelect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const posterUrl = item.poster_path
    ? item.poster_path.startsWith('http')
      ? item.poster_path
      : `https://image.tmdb.org/t/p/w400${item.poster_path}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const updateFromPoint = useCallback((clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const py = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    const rotY = ((px - 50) / 50) * 12;
    const rotX = ((py - 50) / 50) * -12;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      el.style.setProperty('--pointer-x', `${px.toFixed(1)}%`);
      el.style.setProperty('--pointer-y', `${py.toFixed(1)}%`);
      el.style.setProperty('--rotate-x', `${rotX.toFixed(2)}deg`);
      el.style.setProperty('--rotate-y', `${rotY.toFixed(2)}deg`);
      el.style.setProperty('--card-scale', '1.045');
    });
  }, []);

  const resetTilt = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      el.style.setProperty('--rotate-x', '0deg');
      el.style.setProperty('--rotate-y', '0deg');
      el.style.setProperty('--card-scale', '1');
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => updateFromPoint(e.clientX, e.clientY)}
      onMouseLeave={resetTilt}
      onClick={() => {
        if (onSelect) {
          onSelect({
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
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        aspectRatio: '2/3',
        background: 'var(--bg-card)',
        cursor: onSelect ? 'pointer' : 'default',
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transform:
          'perspective(1000px) rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg)) scale3d(var(--card-scale, 1), var(--card-scale, 1), var(--card-scale, 1))',
        transition: 'transform 0.28s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.25s ease, box-shadow 0.25s ease',
        border: '1px solid rgba(245, 179, 53, 0.45)',
        boxShadow:
          'calc(var(--rotate-y, 0deg) * -1.2px) calc(var(--rotate-x, 0deg) * 1.5px + 12px) 32px -4px rgba(0, 0, 0, 0.9), 0 0 25px rgba(245, 179, 53, 0.22)'
      }}
    >
      {/* Dynamic Gold Specular Sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at var(--pointer-x, 50%) var(--pointer-y, 50%), rgba(255, 255, 255, 0.35) 0%, rgba(245, 179, 53, 0.22) 30%, transparent 70%)',
          mixBlendMode: 'overlay',
          zIndex: 6
        }}
      />

      <img
        src={posterUrl}
        alt={item.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Floating 3D Slot Rank Badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'rgba(6, 7, 10, 0.85)',
          border: '1px solid rgba(245, 179, 53, 0.6)',
          backdropFilter: 'blur(8px)',
          color: 'var(--accent-gold)',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          padding: '2px 7px',
          borderRadius: 'var(--radius-full)',
          transform: 'translateZ(30px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
          zIndex: 8
        }}
      >
        #{slotNum}
      </div>

      {isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(slotNum);
          }}
          title="Remove from favorites"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '50%',
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transform: 'translateZ(32px)',
            zIndex: 9,
            transition: 'all 0.15s ease'
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
          padding: '1.5rem 0.75rem 0.65rem',
          background: 'linear-gradient(to top, rgba(6,7,10,0.96) 20%, transparent)',
          color: '#fff',
          transform: 'translateZ(25px)',
          zIndex: 7
        }}
      >
        <p
          style={{
            fontSize: '0.88rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--font-display)'
          }}
        >
          {item.title}
        </p>
        {item.release_year && (
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {item.release_year}
          </span>
        )}
      </div>
    </div>
  );
};

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Star size={19} color="var(--accent-gold)" fill="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.3px', fontFamily: 'var(--font-display)', color: '#ffffff' }}>
            Favorite Films
          </h3>
        </div>
        {isOwner && (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Choose your 4 defining cinema masterpieces
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.25rem',
          perspective: '1200px'
        }}
      >
        {slots.map((slotNum) => {
          const item = favorites.find((f) => f.slot === slotNum);

          if (item) {
            return (
              <FavoriteSlotItem
                key={slotNum}
                item={item}
                slotNum={slotNum}
                isOwner={isOwner}
                onRemove={handleRemoveSlot}
                onSelect={onSelectMovie}
              />
            );
          }

          // 3D Presentation Empty Slot
          return (
            <div
              key={slotNum}
              onClick={() => {
                if (isOwner) {
                  setActiveSlot(slotNum);
                }
              }}
              style={{
                borderRadius: 'var(--radius-lg)',
                aspectRatio: '2/3',
                border: isOwner ? '1px dashed rgba(245, 179, 53, 0.4)' : '1px dashed var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isOwner ? 'pointer' : 'default',
                color: 'var(--text-muted)',
                gap: '0.6rem',
                transition: 'all 0.28s var(--ease-3d)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
              }}
              onMouseEnter={(e) => {
                if (isOwner) {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  e.currentTarget.style.boxShadow = '0 14px 32px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 179, 53, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (isOwner) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(245, 179, 53, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
                }
              }}
            >
              {isOwner ? (
                <>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'rgba(245, 179, 53, 0.12)',
                      border: '1px solid rgba(245, 179, 53, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-gold)',
                      boxShadow: '0 0 16px rgba(245, 179, 53, 0.15)'
                    }}
                  >
                    <Plus size={20} strokeWidth={2.6} />
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0' }}>Top #{slotNum}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Select Film</span>
                </>
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Empty #{slotNum}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Select Movie Modal for Active Slot */}
      {activeSlot !== null && (
        <div className="modal-overlay" onClick={() => setActiveSlot(null)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Star size={18} color="var(--accent-gold)" fill="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Choose Favorite Film #{activeSlot}</h3>
              </div>
              <button onClick={() => setActiveSlot(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="nav-search" style={{ maxWidth: '100%', position: 'relative' }}>
                <Search size={16} className="nav-search-icon" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a title (e.g. Parasite, Blade Runner, Spirited Away)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 360, overflowY: 'auto' }}>
                {loading ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Searching film archive...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((m) => {
                    const posterUrl = m.poster_path
                      ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w200${m.poster_path}`)
                      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';

                    return (
                      <div
                        key={m.tmdb_id}
                        onClick={() => handleAssignMovie(m)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          border: '1px solid var(--border-subtle)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-gold)';
                          e.currentTarget.style.background = 'rgba(245, 179, 53, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                      >
                        <img
                          src={posterUrl}
                          alt={m.title}
                          style={{ width: 38, height: 56, borderRadius: 4, objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{m.title}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {m.release_year} {m.director ? `• Dir. ${m.director}` : ''}
                          </span>
                        </div>
                        <button className="btn btn-gold" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                          Set #{activeSlot}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {searchQuery ? 'No movies found.' : 'Search for a masterpiece to showcase in your vault.'}
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
