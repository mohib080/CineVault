import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { MoviesPage } from './pages/MoviesPage';
import { SeriesPage } from './pages/SeriesPage';
import { CalendarPage } from './pages/CalendarPage';
import { Dashboard } from './pages/Dashboard';
import { MovieDetail } from './pages/MovieDetail';
import { PersonDetail } from './pages/PersonDetail';
import { ListsPage } from './pages/ListsPage';
import { SharedVault } from './pages/SharedVault';
import { UserProfile } from './pages/UserProfile';
import { LogMovieModal } from './components/LogMovieModal';
import { LetterboxdImportModal } from './components/LetterboxdImportModal';
import { AuthModal } from './pages/AuthPage';
import { Movie, DiaryEntry, api } from './services/api';
import { Search, Film, X } from 'lucide-react';

export type TabType = 'home' | 'movies' | 'series' | 'calendar' | 'dashboard' | 'lists' | 'detail' | 'profile' | 'shared' | 'person';

interface RouteState {
  tab: TabType;
  movieId?: number | null;
  movieType?: string;
  personId?: number | null;
  profileUsername?: string;
  sharedParams?: { type: 'r' | 'l'; id: number; token?: string } | null;
}

function parseLocation(): RouteState {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token') || undefined;

  // 1. Shared vault: /vault/r/:id or /vault/l/:id
  const sharedMatch = path.match(/^\/vault\/(r|l)\/(\d+)/i);
  if (sharedMatch) {
    return {
      tab: 'shared',
      sharedParams: {
        type: sharedMatch[1].toLowerCase() as 'r' | 'l',
        id: parseInt(sharedMatch[2], 10),
        token
      }
    };
  }

  // 2. Movie detail: /movie/:id
  const movieMatch = path.match(/^\/movie\/(\d+)/i);
  if (movieMatch) {
    return {
      tab: 'detail',
      movieId: parseInt(movieMatch[1], 10),
      movieType: 'movie'
    };
  }

  // 3. TV/Series detail: /tv/:id or /series/:id
  const tvMatch = path.match(/^\/(?:tv|series)\/(\d+)/i);
  if (tvMatch) {
    return {
      tab: 'detail',
      movieId: parseInt(tvMatch[1], 10),
      movieType: 'series'
    };
  }

  // 4. Person detail: /person/:id
  const personMatch = path.match(/^\/person\/(\d+)/i);
  if (personMatch) {
    return {
      tab: 'person',
      personId: parseInt(personMatch[1], 10)
    };
  }

  // 5. User Profile: /profile/:username
  const profileMatch = path.match(/^\/profile\/([^/]+)/i);
  if (profileMatch) {
    return {
      tab: 'profile',
      profileUsername: decodeURIComponent(profileMatch[1])
    };
  }

  // 6. Navigation tabs
  const cleanPath = path.replace(/\/+$/, '').toLowerCase();
  if (cleanPath === '/movies') return { tab: 'movies' };
  if (cleanPath === '/series') return { tab: 'series' };
  if (cleanPath === '/calendar') return { tab: 'calendar' };
  if (cleanPath === '/my-space' || cleanPath === '/space' || cleanPath === '/dashboard') return { tab: 'dashboard' };
  if (cleanPath === '/lists') return { tab: 'lists' };

  return { tab: 'home' };
}

function getPathForState(state: RouteState): string {
  if (state.tab === 'shared' && state.sharedParams) {
    const t = state.sharedParams.token ? `?token=${encodeURIComponent(state.sharedParams.token)}` : '';
    return `/vault/${state.sharedParams.type}/${state.sharedParams.id}${t}`;
  }
  if (state.tab === 'detail' && state.movieId) {
    return state.movieType === 'series' ? `/tv/${state.movieId}` : `/movie/${state.movieId}`;
  }
  if (state.tab === 'person' && state.personId) {
    return `/person/${state.personId}`;
  }
  if (state.tab === 'profile' && state.profileUsername) {
    return `/profile/${encodeURIComponent(state.profileUsername)}`;
  }
  if (state.tab === 'movies') return '/movies';
  if (state.tab === 'series') return '/series';
  if (state.tab === 'calendar') return '/calendar';
  if (state.tab === 'dashboard') return '/my-space';
  if (state.tab === 'lists') return '/lists';
  return '/';
}

function AppContent() {
  const { user } = useAuth();

  const [routeState, setRouteState] = useState<RouteState>(() => parseLocation());
  const hasNavigatedRef = useRef(false);

  // Modals
  const [logModalMovie, setLogModalMovie] = useState<Movie | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQuickSearchModal, setShowQuickSearchModal] = useState(false);
  const [quickSearchInput, setQuickSearchInput] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState<Movie[]>([]);

  // Ref to track if any modal is currently open
  const modalOpenRef = useRef(false);
  useEffect(() => {
    modalOpenRef.current = !!(logModalMovie || authModalMode || showImportModal || showQuickSearchModal);
  }, [logModalMovie, authModalMode, showImportModal, showQuickSearchModal]);

  const navigateTo = (nextState: RouteState, replace: boolean = false) => {
    const url = getPathForState(nextState);
    if (replace) {
      window.history.replaceState(nextState, '', url);
    } else {
      window.history.pushState(nextState, '', url);
      hasNavigatedRef.current = true;
    }
    setRouteState(nextState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (hasNavigatedRef.current && window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo({ tab: 'home' });
    }
  };

  // Browser History (popstate) & Keyboard Back Listener
  useEffect(() => {
    // Ensure initial entry has state attached
    const initial = parseLocation();
    window.history.replaceState(initial, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // If a modal was open, close it on back navigation
      if (modalOpenRef.current) {
        setLogModalMovie(null);
        setEditingEntry(null);
        setAuthModalMode(null);
        setShowImportModal(false);
        setShowQuickSearchModal(false);
      }
      const state: RouteState = event.state && event.state.tab ? event.state : parseLocation();
      setRouteState(state);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Handle Backspace when not typing in an input/textarea
      if (e.key === 'Backspace' && !isInput) {
        e.preventDefault();
        handleGoBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectTab = (tab: TabType) => {
    if (tab === routeState.tab && !routeState.movieId && !routeState.personId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigateTo({ tab });
  };

  const handleSelectMovie = (movie: Movie) => {
    const isSeries = movie.title_type === 'series' || movie.overview?.includes('[TV Series]');
    navigateTo({
      tab: 'detail',
      movieId: movie.tmdb_id,
      movieType: isSeries ? 'series' : 'movie'
    });
  };

  const handleSelectPerson = (personId: number) => {
    navigateTo({
      tab: 'person',
      personId
    });
  };

  const handleOpenLogForMovie = (movie: Movie) => {
    if (!user) {
      setAuthModalMode('login');
      return;
    }
    setEditingEntry(null);
    setLogModalMovie(movie);
  };

  const handleQuickLogTrigger = () => {
    if (!user) {
      setAuthModalMode('login');
      return;
    }
    setShowQuickSearchModal(true);
  };

  const handleQuickSearch = async (q: string) => {
    setQuickSearchInput(q);
    if (!q.trim()) {
      setQuickSearchResults([]);
      return;
    }
    try {
      const res = await api.searchMovies(q);
      setQuickSearchResults(res.results.slice(0, 6));
    } catch {
      // ignore
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentTab={routeState.tab}
        onSelectTab={(tab) => handleSelectTab(tab as TabType)}
        onSelectMovie={handleSelectMovie}
        onSelectPerson={handleSelectPerson}
        onQuickLog={handleQuickLogTrigger}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onOpenImportCSV={() => setShowImportModal(true)}
      />

      <main className="main-content">
        {routeState.tab === 'shared' && routeState.sharedParams && (
          <SharedVault
            type={routeState.sharedParams.type}
            id={routeState.sharedParams.id}
            token={routeState.sharedParams.token}
            onGoHome={() => navigateTo({ tab: 'home' })}
          />
        )}

        {routeState.tab === 'home' && (
          <Home
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {routeState.tab === 'movies' && (
          <MoviesPage
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {routeState.tab === 'series' && (
          <SeriesPage
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {routeState.tab === 'calendar' && (
          <CalendarPage
            onSelectMovie={handleSelectMovie}
            onOpenLogModal={handleOpenLogForMovie}
            onOpenAuth={(mode) => setAuthModalMode(mode)}
          />
        )}

        {routeState.tab === 'dashboard' && (
          <Dashboard
            onQuickLog={handleQuickLogTrigger}
            onSelectMovie={handleSelectMovie}
            onEditEntry={(entry) => {
              setEditingEntry(entry);
              setLogModalMovie({
                tmdb_id: entry.tmdb_id,
                title: entry.title || 'Movie',
                release_year: entry.release_year,
                poster_path: entry.poster_path,
                backdrop_path: entry.backdrop_path,
                director: entry.director,
                runtime: entry.runtime
              });
            }}
          />
        )}

        {routeState.tab === 'lists' && <ListsPage />}

        {routeState.tab === 'detail' && routeState.movieId && (
          <MovieDetail
            key={`movie-${routeState.movieId}`}
            tmdbId={routeState.movieId}
            titleType={routeState.movieType}
            onBack={handleGoBack}
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {routeState.tab === 'person' && routeState.personId && (
          <PersonDetail
            key={`person-${routeState.personId}`}
            personId={routeState.personId}
            onBack={handleGoBack}
            onSelectMovie={handleSelectMovie}
            onLogMovie={handleOpenLogForMovie}
          />
        )}

        {routeState.tab === 'profile' && (
          <UserProfile
            username={routeState.profileUsername || (user ? user.username : '')}
            onSelectMovie={handleSelectMovie}
          />
        )}
      </main>

      {/* Log Movie Modal */}
      {logModalMovie && (
        <LogMovieModal
          movie={logModalMovie}
          initialEntry={editingEntry}
          onClose={() => {
            setLogModalMovie(null);
            setEditingEntry(null);
          }}
          onSuccess={() => {
            setLogModalMovie(null);
            setEditingEntry(null);
            if (routeState.tab === 'dashboard') {
              navigateTo({ tab: 'dashboard' }, true);
            }
          }}
        />
      )}

      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={() => {
            setAuthModalMode(null);
            if (routeState.tab === 'home') {
              navigateTo({ tab: 'dashboard' });
            }
          }}
        />
      )}

      {/* Letterboxd CSV Import Modal */}
      {showImportModal && (
        <LetterboxdImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            if (routeState.tab === 'dashboard') {
              window.location.reload();
            } else {
              navigateTo({ tab: 'dashboard' });
            }
          }}
        />
      )}

      {/* Quick Log Film Selector Modal */}
      {showQuickSearchModal && (
        <div className="modal-overlay" onClick={() => setShowQuickSearchModal(false)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Film size={18} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Quick Log Film to Vault</h3>
              </div>
              <button onClick={() => setShowQuickSearchModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="nav-search" style={{ maxWidth: '100%', position: 'relative' }}>
                <Search size={16} className="nav-search-icon" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type film name (e.g. Oppenheimer, Dune, Interstellar)..."
                  value={quickSearchInput}
                  onChange={(e) => handleQuickSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 340, overflowY: 'auto' }}>
                {quickSearchResults.length > 0 ? (
                  quickSearchResults.map((m) => {
                    const posterUrl = m.poster_path
                      ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w200${m.poster_path}`)
                      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';

                    return (
                      <div
                        key={m.tmdb_id}
                        onClick={() => {
                          setShowQuickSearchModal(false);
                          handleOpenLogForMovie(m);
                        }}
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
                  })
                ) : (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {quickSearchInput ? 'No movies found.' : 'Search for any movie above to log it to your vault.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
