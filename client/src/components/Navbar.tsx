import React, { useState, useEffect, useRef } from 'react';
import { Shield, Film, Search, Bookmark, User as UserIcon, LogOut, Plus, Lock, Tv, Star, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Movie, api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSearchMovie: (query: string) => void;
  onSelectMovie?: (movie: Movie) => void;
  onQuickLog?: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onSearchMovie,
  onSelectMovie,
  onQuickLog,
  onOpenAuth
}) => {
  const { user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = searchContainerRef.current?.querySelector('input');
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Debounced live dynamic suggestions
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchMovies(trimmed);
        setSuggestions(res.results.slice(0, 7));
        setIsOpen(true);
      } catch (err) {
        console.warn('Search suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsOpen(false);
      onSearchMovie(searchInput.trim());
      onSelectTab('home');
    }
  };

  const handleSelectSuggestion = (movie: Movie) => {
    setIsOpen(false);
    setSearchInput('');
    if (onSelectMovie) {
      onSelectMovie(movie);
    } else {
      onSearchMovie(movie.title);
      onSelectTab('home');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSearchMovie('');
            onSelectTab('home');
          }}
          className="nav-brand"
        >
          <div className="vault-badge-icon">
            <Shield size={19} strokeWidth={2.8} />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            Cine<span style={{ color: 'var(--accent-cyan)' }}>Vault</span>
          </span>
        </a>

        {/* Global Movie & Series Search Ribbon with Live Dynamic Autocomplete */}
        <div ref={searchContainerRef} className="nav-search" style={{ position: 'relative' }}>
          <form onSubmit={handleSearchSubmit}>
            <Search size={16} className="nav-search-icon" />
            <input
              type="text"
              placeholder="Search films, series, directors... (Ctrl+K)"
              value={searchInput}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSuggestions([]);
                  setIsOpen(false);
                }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <kbd
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  fontFamily: 'monospace'
                }}
              >
                ⌘K
              </kbd>
            )}
          </form>

          {/* Dynamic Suggestion Dropdown */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: '#0e131d',
                border: '1px solid var(--accent-cyan-glow)',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 229, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                zIndex: 1000,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              {isSearching && suggestions.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  Searching CineVault & IMDb catalog...
                </div>
              ) : suggestions.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  No titles found matching "{searchInput}"
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                    Matching Titles ({suggestions.length})
                  </div>

                  {suggestions.map((m) => {
                    const isSeries = m.title_type === 'series' || m.overview?.includes('[TV Series]');
                    const posterUrl = m.poster_path
                      ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w200${m.poster_path}`)
                      : null;

                    return (
                      <div
                        key={m.tmdb_id}
                        onClick={() => handleSelectSuggestion(m)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.6rem 0.85rem',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          borderBottom: '1px solid rgba(255,255,255,0.04)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 229, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={m.title}
                            style={{ width: 32, height: 46, borderRadius: 3, objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 46,
                              borderRadius: 3,
                              background: '#19202a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSeries ? 'var(--accent-gold)' : 'var(--accent-cyan)'
                            }}
                          >
                            {isSeries ? <Tv size={15} /> : <Film size={15} />}
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <h5
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                color: 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {m.title}
                            </h5>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: 3,
                                textTransform: 'uppercase',
                                background: isSeries ? 'rgba(245, 179, 53, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                                color: isSeries ? 'var(--accent-gold)' : 'var(--accent-cyan)'
                              }}
                            >
                              {isSeries ? 'Series' : 'Film'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 2, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>{m.release_year || '—'}</span>
                            {(m.vote_average || m.rating) && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--accent-gold)', fontWeight: 700 }}>
                                <Star size={11} fill="var(--accent-gold)" /> {(m.vote_average || m.rating)?.toFixed(1)}
                              </span>
                            )}
                            {m.director && (
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.director}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    onClick={handleSearchSubmit}
                    style={{
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.78rem',
                      color: 'var(--accent-cyan)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: 'rgba(0, 229, 255, 0.05)'
                    }}
                  >
                    Press <kbd style={{ background: '#252e3d', padding: '1px 5px', borderRadius: 3 }}>Enter</kbd> to view all results for "{searchInput}"
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="nav-links">
          <button
            onClick={() => {
              onSearchMovie('');
              onSelectTab('home');
            }}
            className={`nav-item ${currentTab === 'home' ? 'active' : ''}`}
          >
            <Film size={15} /> <span>Explore</span>
            {currentTab === 'home' && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '3px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '14px',
                  height: '2px',
                  borderRadius: '2px',
                  background: 'var(--accent-cyan)',
                  boxShadow: '0 0 8px var(--accent-cyan)'
                }}
              />
            )}
          </button>

          {user && (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              >
                <Lock size={15} /> <span>My Vault</span>
                {currentTab === 'dashboard' && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '14px',
                      height: '2px',
                      borderRadius: '2px',
                      background: 'var(--accent-cyan)',
                      boxShadow: '0 0 8px var(--accent-cyan)'
                    }}
                  />
                )}
              </button>

              <button
                onClick={() => onSelectTab('lists')}
                className={`nav-item ${currentTab === 'lists' ? 'active' : ''}`}
              >
                <Bookmark size={15} /> <span>Lists</span>
                {currentTab === 'lists' && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '3px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '14px',
                      height: '2px',
                      borderRadius: '2px',
                      background: 'var(--accent-cyan)',
                      boxShadow: '0 0 8px var(--accent-cyan)'
                    }}
                  />
                )}
              </button>
            </>
          )}

          {/* Quick Log Button */}
          {user && onQuickLog && (
            <button
              onClick={onQuickLog}
              className="btn btn-gold"
              style={{ padding: '0.42rem 0.95rem', fontSize: '0.82rem' }}
            >
              <Plus size={14} strokeWidth={2.8} /> Log Film
            </button>
          )}

          {/* User Section */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                onClick={() => onSelectTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.28rem 0.75rem 0.28rem 0.35rem',
                  borderRadius: 'var(--radius-full)',
                  border: currentTab === 'profile' ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: currentTab === 'profile' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
                title="View your public profile"
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#051424',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.username}
                </span>
              </button>
              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '0.38rem 0.6rem', borderRadius: 'var(--radius-full)' }}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn btn-secondary"
                style={{ padding: '0.42rem 0.85rem', fontSize: '0.82rem' }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="btn btn-primary"
                style={{ padding: '0.42rem 0.85rem', fontSize: '0.82rem' }}
              >
                Create Vault
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
