import React, { useState, useEffect, useRef } from 'react';
import { Shield, Film, Search, Bookmark, User as UserIcon, LogOut, Plus, Lock, Tv, Star, X } from 'lucide-react';
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
            <Shield size={18} strokeWidth={2.8} />
          </div>
          <span>
            Cine<span style={{ color: 'var(--accent-cyan)' }}>Vault</span>
          </span>
        </a>

        {/* Global Movie & Series Search Ribbon with Live Dynamic Autocomplete */}
        <div ref={searchContainerRef} className="nav-search" style={{ position: 'relative' }}>
          <form onSubmit={handleSearchSubmit}>
            <Search size={16} className="nav-search-icon" />
            <input
              type="text"
              placeholder="Search films, series, directors..."
              value={searchInput}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
            />
            {searchInput && (
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
                background: '#121721',
                border: '1px solid var(--accent-cyan-glow)',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 15px rgba(0, 229, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                zIndex: 1000,
                backdropFilter: 'blur(16px)'
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
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: 3,
                                textTransform: 'uppercase',
                                background: isSeries ? 'rgba(245, 179, 53, 0.15)' : 'rgba(0, 229, 255, 0.12)',
                                color: isSeries ? 'var(--accent-gold)' : 'var(--accent-cyan)'
                              }}
                            >
                              {isSeries ? 'Series' : 'Movie'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 2, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>{m.release_year || '—'}</span>
                            {m.rating && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--accent-gold)', fontWeight: 600 }}>
                                <Star size={11} fill="var(--accent-gold)" /> {m.rating}
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
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.78rem',
                      color: 'var(--accent-cyan)',
                      fontWeight: 600,
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
            <Film size={16} /> Explore
          </button>

          {user && (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              >
                <Lock size={16} /> My Vault
              </button>

              <button
                onClick={() => onSelectTab('lists')}
                className={`nav-item ${currentTab === 'lists' ? 'active' : ''}`}
              >
                <Bookmark size={16} /> Lists
              </button>
            </>
          )}

          {/* Quick Log Button */}
          {user && onQuickLog && (
            <button
              onClick={onQuickLog}
              className="btn btn-gold"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              <Plus size={15} /> Log Film / Series
            </button>
          )}

          {/* User Section */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <button
                onClick={() => onSelectTab('profile')}
                className="nav-item"
                style={{ fontWeight: 700, color: 'var(--text-main)' }}
                title="View your public profile"
              >
                <UserIcon size={16} color="var(--accent-cyan)" />
                <span>{user.username}</span>
              </button>
              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.65rem' }}
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
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
