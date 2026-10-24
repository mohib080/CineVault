import React, { useState, useEffect } from 'react';
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

function AppContent() {
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMovieType, setSelectedMovieType] = useState<string | undefined>(undefined);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  // Modals
  const [logModalMovie, setLogModalMovie] = useState<Movie | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQuickSearchModal, setShowQuickSearchModal] = useState(false);
  const [quickSearchInput, setQuickSearchInput] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState<Movie[]>([]);

  // Shared reader routing: check window.location.pathname
  const [sharedParams, setSharedParams] = useState<{ type: 'r' | 'l'; id: number; token?: string } | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token') || undefined;

    // Match /vault/r/:id or /vault/l/:id
    const match = path.match(/^\/vault\/(r|l)\/(\d+)/i);
    if (match) {
      setSharedParams({
        type: match[1].toLowerCase() as 'r' | 'l',
        id: parseInt(match[2], 10),
        token
      });
      setCurrentTab('shared');
    }
  }, []);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovieId(movie.tmdb_id);
    setSelectedMovieType(movie.title_type);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPerson = (personId: number) => {
    setSelectedPersonId(personId);
    setCurrentTab('person');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab as TabType);
        }}
        onSelectMovie={handleSelectMovie}
        onSelectPerson={handleSelectPerson}
        onQuickLog={handleQuickLogTrigger}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        onOpenImportCSV={() => setShowImportModal(true)}
      />

      <main className="main-content">
        {currentTab === 'shared' && sharedParams && (
          <SharedVault
            type={sharedParams.type}
            id={sharedParams.id}
            token={sharedParams.token}
            onGoHome={() => {
              window.history.pushState({}, '', '/');
              setSharedParams(null);
              setCurrentTab('home');
            }}
          />
        )}

        {currentTab === 'home' && (
          <Home
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {currentTab === 'movies' && (
          <MoviesPage
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {currentTab === 'series' && (
          <SeriesPage
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarPage
            onSelectMovie={handleSelectMovie}
            onOpenLogModal={handleOpenLogForMovie}
            onOpenAuth={(mode) => setAuthModalMode(mode)}
          />
        )}

        {currentTab === 'dashboard' && (
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

        {currentTab === 'lists' && <ListsPage />}

        {currentTab === 'detail' && selectedMovieId && (
          <MovieDetail
            tmdbId={selectedMovieId}
            titleType={selectedMovieType}
            onBack={() => setCurrentTab('home')}
            onLogMovie={handleOpenLogForMovie}
            onSelectMovie={handleSelectMovie}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {currentTab === 'person' && selectedPersonId && (
          <PersonDetail
            personId={selectedPersonId}
            onBack={() => {
              if (selectedMovieId) {
                setCurrentTab('detail');
              } else {
                setCurrentTab('home');
              }
            }}
            onSelectMovie={handleSelectMovie}
            onLogMovie={handleOpenLogForMovie}
          />
        )}

        {currentTab === 'profile' && user && (
          <UserProfile
            username={user.username}
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
            if (currentTab === 'dashboard') {
              setCurrentTab('dashboard');
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
            if (currentTab === 'home') {
              setCurrentTab('dashboard');
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
            if (currentTab === 'dashboard') {
              window.location.reload();
            } else {
              setCurrentTab('dashboard');
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
