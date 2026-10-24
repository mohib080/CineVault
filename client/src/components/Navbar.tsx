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
  Compass,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Movie, PersonSearchItem, api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSearchMovie: (query: string) => void;
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
  onSelectPerson,
  onQuickLog,
  onOpenAuth,
  onOpenImportCSV
}) => {
  const { user, logout } = useAuth();

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'movies' | 'people'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [peopleResults, setPeopleResults] = useState<PersonSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setMovieResults([]);
      setPeopleResults([]);
    }
  }, [isSearchOpen]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setMovieResults([]);
      setPeopleResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (searchFilter === 'movies' || searchFilter === 'all') {
          const mRes = await api.searchMovies(trimmed);
          setMovieResults(mRes.results || []);
        } else {
          setMovieResults([]);
        }

        if (searchFilter === 'people' || searchFilter === 'all') {
          const pRes = await api.searchPeople(trimmed);
          setPeopleResults(pRes.results || []);
        } else {
          setPeopleResults([]);
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter]);

  const handleSelectMovieItem = (movie: Movie) => {
    setIsSearchOpen(false);
    if (onSelectMovie) {
      onSelectMovie(movie);
    } else {
      onSearchMovie(movie.title);
      onSelectTab('home');
    }
  };

  const handleSelectPersonItem = (personId: number) => {
    setIsSearchOpen(false);
    if (onSelectPerson) {
      onSelectPerson(personId);
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
              onSearchMovie('');
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

          {/* Center Navigation Links (BingeBang layout) */}
          <div className="bb-nav-links">
            <button
              className={`bb-nav-link ${currentTab === 'home' ? 'active' : ''}`}
              onClick={() => {
                onSearchMovie('');
                onSelectTab('home');
              }}
            >
              Home
            </button>
            <button
              className={`bb-nav-link ${currentTab === 'movies' ? 'active' : ''}`}
              onClick={() => onSelectTab('movies')}
            >
              Movies
            </button>
            <button
              className={`bb-nav-link ${currentTab === 'explore' ? 'active' : ''}`}
              onClick={() => onSelectTab('explore')}
            >
              Explore
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
            {/* Command Search Trigger Button */}
            <button
              className="bb-search-trigger"
              onClick={() => setIsSearchOpen(true)}
              title="Search movies, series, directors... (Ctrl+K)"
            >
              <Search size={15} />
              <span style={{ display: 'inline-block' }}>Search...</span>
              <span className="bb-kbd-badge">⌘K</span>
            </button>

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
            onSearchMovie('');
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
          <span>Movies</span>
        </button>

        <button
          className={`bb-dock-btn ${currentTab === 'explore' ? 'active' : ''}`}
          onClick={() => onSelectTab('explore')}
        >
          <Compass size={19} />
          <span>Explore</span>
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

      {/* 3. BingeBang Full-Screen Command Search Modal */}
      {isSearchOpen && (
        <div
          className="bb-search-backdrop"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bb-search-window"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Search Input & ESC Close Badge */}
            <div className="bb-search-header">
              <Search size={20} color="var(--accent-gold)" />
              <input
                ref={searchInputRef}
                className="bb-search-input"
                type="text"
                placeholder="Start typing a title, director, or actor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="bb-kbd-badge"
                onClick={() => setIsSearchOpen(false)}
                style={{ cursor: 'pointer' }}
                title="Close (Escape)"
              >
                ESC
              </button>
            </div>

            {/* Filter Tabs: All | Movies | People */}
            <div className="bb-search-tabs">
              <button
                className={`bb-search-tab ${searchFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSearchFilter('all')}
              >
                All
              </button>
              <button
                className={`bb-search-tab ${searchFilter === 'movies' ? 'active' : ''}`}
                onClick={() => setSearchFilter('movies')}
              >
                Movies & TV
              </button>
              <button
                className={`bb-search-tab ${searchFilter === 'people' ? 'active' : ''}`}
                onClick={() => setSearchFilter('people')}
              >
                Cast & Directors
              </button>
            </div>

            {/* Results List */}
            <div className="bb-search-results-list">
              {isSearching ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Searching CineVault & TMDB live...
                </div>
              ) : searchQuery.trim() && movieResults.length === 0 && peopleResults.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No titles or people found matching "{searchQuery}"
                </div>
              ) : (
                <div>
                  {/* Movies / TV Results */}
                  {movieResults.length > 0 && (
                    <div>
                      <div
                        style={{
                          padding: '0.6rem 1.25rem',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}
                      >
                        Films & Series ({movieResults.length})
                      </div>
                      {movieResults.map((m) => {
                        const isSeries = m.title_type === 'series' || m.overview?.includes('[TV Series]');
                        const posterUrl = m.poster_path
                          ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w200${m.poster_path}`)
                          : null;
                        const score = m.vote_average || m.rating;

                        return (
                          <div
                            key={m.tmdb_id}
                            className="bb-search-item"
                            onClick={() => handleSelectMovieItem(m)}
                          >
                            {posterUrl ? (
                              <img
                                src={posterUrl}
                                alt={m.title}
                                className="bb-search-poster"
                              />
                            ) : (
                              <div
                                className="bb-search-poster"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#151922',
                                  color: isSeries ? 'var(--accent-gold)' : 'var(--accent-cyan)'
                                }}
                              >
                                {isSeries ? <Tv size={16} /> : <Film size={16} />}
                              </div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="bb-search-title">{m.title}</span>
                                {score && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      fontSize: '0.72rem',
                                      color: 'var(--accent-gold)',
                                      fontFamily: 'var(--font-mono)'
                                    }}
                                  >
                                    <Star size={11} fill="var(--accent-gold)" />
                                    {score.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <div className="bb-search-meta">
                                <span>{m.release_year || 'Cinema'}</span>
                                {m.director && <span>• Dir. {m.director}</span>}
                              </div>
                            </div>

                            <ArrowRight size={15} color="var(--text-dim)" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Cast & Directors Results */}
                  {peopleResults.length > 0 && (
                    <div>
                      <div
                        style={{
                          padding: '0.6rem 1.25rem',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}
                      >
                        People ({peopleResults.length})
                      </div>
                      {peopleResults.map((p) => {
                        const profileUrl = p.profile_path
                          ? `https://image.tmdb.org/t/p/w185${p.profile_path}`
                          : null;

                        return (
                          <div
                            key={p.id}
                            className="bb-search-item"
                            onClick={() => handleSelectPersonItem(p.id)}
                          >
                            {profileUrl ? (
                              <img
                                src={profileUrl}
                                alt={p.name}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  background: '#1e2430',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--accent-gold)',
                                  fontWeight: 800
                                }}
                              >
                                {p.name.charAt(0)}
                              </div>
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="bb-search-title">{p.name}</div>
                              <div className="bb-search-meta">
                                <span>{p.known_for_department || 'Film Industry'}</span>
                              </div>
                            </div>

                            <ArrowRight size={15} color="var(--text-dim)" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!searchQuery.trim() && (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Start typing to search over 1,000,000 films, TV series, actors, and directors...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
