import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Film,
  Search,
  Bookmark,
  User as UserIcon,
  LogOut,
  Plus,
  Tv,
  Star,
  X,
  ChevronDown,
  Upload,
  CalendarDays,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Movie, api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSearchMovie?: (query: string) => void;
  onSelectMovie?: (movie: Movie) => void;
  onSelectPerson?: (personId: number) => void;
  onQuickLog?: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenImportCSV?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onSearchMovie,
  onSelectMovie,
  onQuickLog,
  onOpenAuth,
  onOpenImportCSV
}) => {
  const { user, logout } = useAuth();

  // Inline search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener & click-outside dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim()) {
          setIsSuggestionsOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setIsSuggestionsOpen(false);
        setIsProfileOpen(false);
        searchInputRef.current?.blur();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  // Debounced live search autocomplete
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsSearching(false);
      setIsSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchMovies(trimmed);
        const results = res.results || [];
        setSuggestions(results.slice(0, 8));
        setIsSuggestionsOpen(true);
      } catch (err) {
        console.warn('Autocomplete search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectMovieItem = (movie: Movie) => {
    setIsSuggestionsOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    if (onSelectMovie) {
      onSelectMovie(movie);
    } else if (onSearchMovie) {
      onSearchMovie(movie.title);
      onSelectTab('home');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectMovieItem(suggestions[0]);
    }
  };

  return (
    <>
      {/* 1. BingeBang Fixed Top Navigation */}
      <nav className="bb-navbar">
        <div className="bb-navbar-inner">
          {/* Brand Wordmark */}
          <div
            className="bb-brand"
            onClick={() => {
              if (onSearchMovie) onSearchMovie('');
              onSelectTab('home');
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#051424',
                boxShadow: '0 0 16px rgba(0, 229, 255, 0.4)'
              }}
            >
              <Shield size={18} strokeWidth={2.8} />
            </div>
            <span>
              CineVault<span className="bb-brand-dot" />
            </span>
          </div>

          {/* Center Navigation Links - Home, Movie, Series, Calendar, My Space */}
          <div className="bb-nav-links">
            <button
              className={`bb-nav-link ${currentTab === 'home' ? 'active' : ''}`}
              onClick={() => {
                if (onSearchMovie) onSearchMovie('');
                onSelectTab('home');
              }}
            >
              Home
            </button>
            <button
              className={`bb-nav-link ${currentTab === 'movies' ? 'active' : ''}`}
              onClick={() => onSelectTab('movies')}
            >
              Movie
            </button>
            <button
              className={`bb-nav-link ${currentTab === 'series' ? 'active' : ''}`}
              onClick={() => onSelectTab('series')}
            >
              Series
            </button>
            <button
              className={`bb-nav-link ${currentTab === 'calendar' ? 'active' : ''}`}
              onClick={() => onSelectTab('calendar')}
            >
              Calendar
            </button>
            <button
              className={`bb-nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                if (!user) {
                  onOpenAuth('login');
                } else {
                  onSelectTab('dashboard');
                }
              }}
            >
              My Space
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="bb-nav-controls">
            {/* Inline Search Bar with Dropdown Suggestions */}
            <div className="bb-search-container" ref={searchContainerRef}>
              <form className="bb-search-bar" onSubmit={handleFormSubmit}>
                <Search size={16} className="bb-search-bar-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search films, series, directors... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) {
                      setIsSuggestionsOpen(true);
                    }
                  }}
                  autoComplete="off"
                  spellCheck="false"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="bb-search-clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                      setIsSuggestionsOpen(false);
                    }}
                    title="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </form>

              {/* Small Suggestions Dropdown List */}
              {isSuggestionsOpen && (suggestions.length > 0 || isSearching || (searchQuery.trim() && !isSearching)) && (
                <div className="bb-suggestions-dropdown">
                  {isSearching ? (
                    <div style={{ padding: '0.9rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Searching CineVault & TMDB...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div style={{ padding: '0.9rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No matches found for "{searchQuery}"
                    </div>
                  ) : (
                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                      {suggestions.map((m) => {
                        const isSeries = m.title_type === 'series' || m.overview?.includes('[TV Series]');
                        const posterUrl = m.poster_path
                          ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w92${m.poster_path}`)
                          : null;
                        const score = m.vote_average || m.rating;

                        return (
                          <div
                            key={m.tmdb_id}
                            className="bb-suggestion-item"
                            onClick={() => handleSelectMovieItem(m)}
                          >
                            {posterUrl ? (
                              <img
                                src={posterUrl}
                                alt={m.title}
                                className="bb-suggestion-poster"
                              />
                            ) : (
                              <div
                                className="bb-suggestion-poster"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#151922',
                                  color: isSeries ? 'var(--accent-gold)' : 'var(--accent-cyan)'
                                }}
                              >
                                {isSeries ? <Tv size={14} /> : <Film size={14} />}
                              </div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="bb-suggestion-title">
                                {m.title}
                              </div>
                              <div className="bb-suggestion-meta">
                                <span
                                  style={{
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    background: isSeries ? 'rgba(255, 184, 0, 0.15)' : 'rgba(0, 229, 255, 0.12)',
                                    color: isSeries ? 'var(--accent-gold)' : 'var(--accent-cyan)',
                                    fontSize: '0.68rem',
                                    fontWeight: 700
                                  }}
                                >
                                  {isSeries ? 'Series' : 'Film'}
                                </span>
                                <span>{m.release_year || 'Cinema'}</span>
                                {score ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      color: 'var(--accent-gold)',
                                      marginLeft: 'auto'
                                    }}
                                  >
                                    <Star size={10} fill="var(--accent-gold)" />
                                    {score.toFixed(1)}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <ArrowRight size={13} color="var(--text-dim)" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Log CTA Button */}
            {user && onQuickLog && (
              <button
                className="btn-bb-primary"
                onClick={onQuickLog}
                style={{ padding: '0.45rem 1.05rem', fontSize: '0.84rem' }}
                title="Quick Log a film to your Vault"
              >
                <Plus size={15} strokeWidth={2.6} /> Log
              </button>
            )}

            {/* User Profile or Login/Register Buttons */}
            {user ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <div
                  className="bb-profile-pill"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                >
                  <div className="bb-avatar-circle">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      maxWidth: '90px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.username}
                  </span>
                  <ChevronDown
                    size={14}
                    color="var(--text-muted)"
                    style={{
                      transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="bb-profile-dropdown">
                    <div
                      style={{
                        padding: '0.6rem 0.85rem 0.75rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        marginBottom: '0.4rem'
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                        {user.username}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {user.email || 'CineVault Member'}
                      </div>
                    </div>

                    <button
                      className="bb-dropdown-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onSelectTab('dashboard');
                      }}
                    >
                      <UserIcon size={15} /> My Space (Vault)
                    </button>

                    {onOpenImportCSV && (
                      <button
                        className="bb-dropdown-item"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenImportCSV();
                        }}
                      >
                        <Upload size={15} /> Import Letterboxd CSV
                      </button>
                    )}

                    <button
                      className="bb-dropdown-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onSelectTab('lists');
                      }}
                    >
                      <Bookmark size={15} /> Curated Lists
                    </button>

                    <div
                      style={{
                        height: 1,
                        background: 'var(--border-subtle)',
                        margin: '0.4rem 0'
                      }}
                    />

                    <button
                      className="bb-dropdown-item"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      style={{ color: 'var(--accent-rose)' }}
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  className="bb-nav-link"
                  onClick={() => onOpenAuth('login')}
                  style={{ padding: '0.45rem 0.85rem' }}
                >
                  Log in
                </button>
                <button
                  className="btn-bb-primary"
                  onClick={() => onOpenAuth('register')}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}
                >
                  Sign up free
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. BingeBang Mobile Bottom Navigation Dock */}
      <div className="bb-mobile-dock">
        <button
          className={`bb-dock-btn ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            if (onSearchMovie) onSearchMovie('');
            onSelectTab('home');
          }}
        >
          <Flame size={19} />
          <span>Home</span>
        </button>

        <button
          className={`bb-dock-btn ${currentTab === 'movies' ? 'active' : ''}`}
          onClick={() => onSelectTab('movies')}
        >
          <Film size={19} />
          <span>Movie</span>
        </button>

        <button
          className={`bb-dock-btn ${currentTab === 'series' ? 'active' : ''}`}
          onClick={() => onSelectTab('series')}
        >
          <Tv size={19} />
          <span>Series</span>
        </button>

        <button
          className={`bb-dock-btn ${currentTab === 'calendar' ? 'active' : ''}`}
          onClick={() => onSelectTab('calendar')}
        >
          <CalendarDays size={19} />
          <span>Calendar</span>
        </button>

        <button
          className={`bb-dock-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            if (!user) onOpenAuth('login');
            else onSelectTab('dashboard');
          }}
        >
          <Shield size={19} />
          <span>My Space</span>
        </button>
      </div>
    </>
  );
};
