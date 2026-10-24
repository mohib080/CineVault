import React, { useState, useEffect, useRef } from 'react';
import { Movie, Genre, DiaryEntry, api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MovieCard } from '../components/MovieCard';
import { TrailerModal } from '../components/TrailerModal';
import {
  Shield,
  Sparkles,
  Flame,
  Trophy,
  CalendarDays,
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  Loader2,
  Compass,
  Film
} from 'lucide-react';

interface HomeProps {
  onLogMovie: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

const STANDARD_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }
];

const DECADES = [
  { label: 'All Decades', value: 0 },
  { label: '2024–2025', value: 2024 },
  { label: '2020–2023', value: 2022 },
  { label: '2010s', value: 2015 },
  { label: '2000s', value: 2005 },
  { label: '1990s', value: 1995 },
  { label: '1980s', value: 1985 },
  { label: '1970s', value: 1975 }
];

export const Home: React.FC<HomeProps> = ({ onLogMovie, onSelectMovie, searchQuery, onClearSearch }) => {
  const { user } = useAuth();

  // Hero Spotlight Carousel State
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroRafRef = useRef<number | null>(null);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroSectionRef.current) return;
    const rect = heroSectionRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = px * 7;
    const rotX = py * -7;

    if (heroRafRef.current !== null) cancelAnimationFrame(heroRafRef.current);
    heroRafRef.current = requestAnimationFrame(() => {
      const section = heroSectionRef.current;
      if (!section) return;
      section.style.setProperty('--hero-rot-x', `${rotX.toFixed(2)}deg`);
      section.style.setProperty('--hero-rot-y', `${rotY.toFixed(2)}deg`);
    });
  };

  const handleHeroMouseLeave = () => {
    setIsHeroPaused(false);
    if (heroRafRef.current !== null) cancelAnimationFrame(heroRafRef.current);
    heroRafRef.current = requestAnimationFrame(() => {
      const section = heroSectionRef.current;
      if (!section) return;
      section.style.setProperty('--hero-rot-x', '0deg');
      section.style.setProperty('--hero-rot-y', '0deg');
    });
  };

  // Swimlanes Data
  const [vaultRecent, setVaultRecent] = useState<DiaryEntry[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingWindow, setTrendingWindow] = useState<'trending' | 'popular'>('trending');
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);

  // Catalogue Grid State
  const [catalogueMovies, setCatalogueMovies] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [cataloguePage, setCataloguePage] = useState(1);
  const [totalCataloguePages, setTotalCataloguePages] = useState(1);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Trailer Modal
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);

  // Swimlane Scroll Refs
  const vaultTrackRef = useRef<HTMLDivElement>(null);
  const trendingTrackRef = useRef<HTMLDivElement>(null);
  const upcomingTrackRef = useRef<HTMLDivElement>(null);
  const topRatedTrackRef = useRef<HTMLDivElement>(null);

  const scrollTrack = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -560 : 560;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenTrailer = async (movie: Movie) => {
    if (movie.trailer_key) {
      setActiveTrailer({ key: movie.trailer_key, title: movie.title });
      return;
    }
    try {
      const res = await api.getMovieDetail(movie.tmdb_id);
      if (res.movie?.trailer_key) {
        setActiveTrailer({ key: res.movie.trailer_key, title: res.movie.title });
      } else {
        onSelectMovie(movie);
      }
    } catch {
      onSelectMovie(movie);
    }
  };

  // 1. Initial Load for Hero Banner & Swimlanes (Parallel Fetch)
  useEffect(() => {
    async function loadHeroAndLanes() {
      try {
        const [trendRes, upRes, topRes] = await Promise.all([
          api.discoverMovies(trendingWindow, 1),
          api.discoverMovies('upcoming', 1),
          api.discoverMovies('top_rated', 1)
        ]);

        setTrendingMovies(trendRes.results);
        if (heroMovies.length === 0 && trendRes.results.length > 0) {
          setHeroMovies(trendRes.results.slice(0, 5));
        }
        setUpcomingMovies(upRes.results);
        setTopRatedMovies(topRes.results);
      } catch (err) {
        console.warn('Initial discovery error:', err);
      }
    }

    loadHeroAndLanes();
  }, [trendingWindow]);

  // 2. Load Vault Recents if logged in
  useEffect(() => {
    if (user) {
      api
        .getMyDiary()
        .then((res) => {
          setVaultRecent(res.entries.slice(0, 12));
        })
        .catch(() => setVaultRecent([]));
    } else {
      setVaultRecent([]);
    }
  }, [user]);

  // 3. Auto-Rotate Hero Banner every 7 seconds
  useEffect(() => {
    if (isHeroPaused || heroMovies.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isHeroPaused, heroMovies.length]);

  // 4. Load Catalogue Grid
  useEffect(() => {
    let isCurrent = true;
    async function loadCatalogue() {
      setLoadingCatalogue(true);
      try {
        const res = await api.discoverMovies(
          'popular',
          1,
          selectedGenre || undefined,
          selectedYear || undefined
        );
        if (isCurrent) {
          setCatalogueMovies(res.results);
          setCataloguePage(1);
          setTotalCataloguePages(res.total_pages);
        }
      } catch (err) {
        console.warn('Catalogue load error:', err);
      } finally {
        if (isCurrent) setLoadingCatalogue(false);
      }
    }

    loadCatalogue();
    return () => {
      isCurrent = false;
    };
  }, [selectedGenre, selectedYear]);

  // Load More Catalogue
  const handleLoadMoreCatalogue = async () => {
    if (cataloguePage >= totalCataloguePages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = cataloguePage + 1;
    try {
      const res = await api.discoverMovies(
        'popular',
        nextPage,
        selectedGenre || undefined,
        selectedYear || undefined
      );
      setCatalogueMovies((prev) => {
        const existingIds = new Set(prev.map((m) => m.tmdb_id));
        const newOnes = res.results.filter((m) => !existingIds.has(m.tmdb_id));
        return [...prev, ...newOnes];
      });
      setCataloguePage(nextPage);
    } catch (err) {
      console.warn('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const currentHero = heroMovies[activeHeroIndex] || heroMovies[0];
  const heroBackdropUrl = currentHero?.backdrop_path
    ? (currentHero.backdrop_path.startsWith('http')
        ? currentHero.backdrop_path
        : `https://image.tmdb.org/t/p/original${currentHero.backdrop_path}`)
    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&auto=format&fit=crop&q=80';

  const heroScore = currentHero?.vote_average || currentHero?.rating;

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Full-Bleed 5-Slide Auto-Rotating Hero Spotlight Banner */}
      {currentHero && (
        <section
          ref={heroSectionRef}
          className="bb-hero-banner"
          style={{ backgroundImage: `url(${heroBackdropUrl})` }}
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
        >
          <div className="bb-hero-vignette" />

          <div className="bb-hero-content">
            {/* Title */}
            <h1
              className="bb-hero-title"
              onClick={() => onSelectMovie(currentHero)}
              title={currentHero.title}
            >
              {currentHero.title}
            </h1>

            {/* BingeBang Dot-Separated Metadata Stack */}
            <div className="bb-hero-meta">
              {heroScore && (
                <div className="bb-hero-rating">
                  <Star size={13} fill="var(--accent-gold)" />
                  <span>{heroScore.toFixed(1)}</span>
                </div>
              )}
              {heroScore && <span className="bb-hero-meta-dot">•</span>}

              {currentHero.release_year && (
                <>
                  <span>{currentHero.release_year}</span>
                  <span className="bb-hero-meta-dot">•</span>
                </>
              )}

              <span>{currentHero.title_type === 'series' ? 'TV Series' : 'Feature Film'}</span>

              {currentHero.director && (
                <>
                  <span className="bb-hero-meta-dot">•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Dir. {currentHero.director}</span>
                </>
              )}
            </div>

            {/* Synopsis */}
            {currentHero.overview && (
              <p className="bb-hero-synopsis">
                {currentHero.overview}
              </p>
            )}

            {/* Action CTA Buttons */}
            <div className="bb-hero-actions">
              <button
                className="btn-bb-primary"
                onClick={() => onLogMovie(currentHero)}
              >
                <Plus size={18} strokeWidth={2.8} /> Log to Vault
              </button>

              <button
                className="btn-bb-secondary"
                onClick={() => handleOpenTrailer(currentHero)}
              >
                <Play size={16} fill="#ffffff" /> Watch Trailer
              </button>

              <button
                className="btn-bb-circle"
                onClick={() => onSelectMovie(currentHero)}
                title="View Full Details"
              >
                <Film size={18} />
              </button>
            </div>
          </div>

          {/* Bottom Right Slide Indicators */}
          {heroMovies.length > 1 && (
            <div className="bb-hero-indicators">
              {heroMovies.map((_, idx) => (
                <div
                  key={idx}
                  className={`bb-indicator-dot ${idx === activeHeroIndex ? 'active' : ''}`}
                  onClick={() => setActiveHeroIndex(idx)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Main Swimlane Content Area */}
      <div className="content-container">
        {/* Row 1: "Recent in Your Vault" (if user logged in & has logs) */}
        {user && vaultRecent.length > 0 && (
          <section className="bb-swimlane">
            <div className="bb-swimlane-header">
              <div className="bb-swimlane-title-group">
                <h3 className="bb-swimlane-title">
                  <Shield size={22} color="var(--accent-cyan)" /> Recent in Your Vault
                </h3>
                <span className="bb-swimlane-subtitle">
                  Pick up where you left off in your private cinema diary
                </span>
              </div>

              <div className="bb-swimlane-controls">
                <button
                  className="bb-arrow-btn"
                  onClick={() => scrollTrack(vaultTrackRef, 'left')}
                  title="Scroll Left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="bb-arrow-btn"
                  onClick={() => scrollTrack(vaultTrackRef, 'right')}
                  title="Scroll Right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div ref={vaultTrackRef} className="bb-swimlane-track">
              {vaultRecent.map((entry) => {
                const asMovie: Movie = {
                  tmdb_id: entry.tmdb_id,
                  title: entry.title || 'Logged Film',
                  release_year: entry.release_year,
                  poster_path: entry.poster_path,
                  backdrop_path: entry.backdrop_path,
                  director: entry.director,
                  runtime: entry.runtime
                };

                return (
                  <MovieCard
                    key={`vault-${entry.id}`}
                    movie={{
                      ...asMovie,
                      rating: entry.rating || undefined,
                      visibility: entry.visibility
                    }}
                    onLogClick={onLogMovie}
                    onTrailerClick={handleOpenTrailer}
                    onClick={onSelectMovie}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Row 2: "Trending Movies" with Segmented Pill Toggle */}
        <section className="bb-swimlane">
          <div className="bb-swimlane-header">
            <div className="bb-swimlane-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <h3 className="bb-swimlane-title">
                  <Flame size={22} color="var(--accent-gold)" /> Trending Movies
                </h3>
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-full)',
                    padding: 2,
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <button
                    onClick={() => setTrendingWindow('trending')}
                    style={{
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-full)',
                      background: trendingWindow === 'trending' ? 'var(--accent-gold)' : 'transparent',
                      color: trendingWindow === 'trending' ? '#000' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setTrendingWindow('popular')}
                    style={{
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-full)',
                      background: trendingWindow === 'popular' ? 'var(--accent-gold)' : 'transparent',
                      color: trendingWindow === 'popular' ? '#000' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Popular
                  </button>
                </div>
              </div>
              <span className="bb-swimlane-subtitle">
                The most watched and logged films across world cinema
              </span>
            </div>

            <div className="bb-swimlane-controls">
              <button
                className="bb-arrow-btn"
                onClick={() => scrollTrack(trendingTrackRef, 'left')}
                title="Scroll Left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="bb-arrow-btn"
                onClick={() => scrollTrack(trendingTrackRef, 'right')}
                title="Scroll Right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div ref={trendingTrackRef} className="bb-swimlane-track">
            {trendingMovies.map((movie) => (
              <MovieCard
                key={`trending-${movie.tmdb_id}`}
                movie={movie}
                onLogClick={onLogMovie}
                onTrailerClick={handleOpenTrailer}
                onClick={onSelectMovie}
              />
            ))}
          </div>
        </section>

        {/* Row 3: "New Releases & In Theaters" */}
        <section className="bb-swimlane">
          <div className="bb-swimlane-header">
            <div className="bb-swimlane-title-group">
              <h3 className="bb-swimlane-title">
                <CalendarDays size={22} color="var(--accent-cyan)" /> New Releases & In Theaters
              </h3>
              <span className="bb-swimlane-subtitle">
                Freshly arrived in cinemas and upcoming premieres
              </span>
            </div>

            <div className="bb-swimlane-controls">
              <button
                className="bb-arrow-btn"
                onClick={() => scrollTrack(upcomingTrackRef, 'left')}
                title="Scroll Left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="bb-arrow-btn"
                onClick={() => scrollTrack(upcomingTrackRef, 'right')}
                title="Scroll Right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div ref={upcomingTrackRef} className="bb-swimlane-track">
            {upcomingMovies.map((movie) => (
              <MovieCard
                key={`upcoming-${movie.tmdb_id}`}
                movie={movie}
                onLogClick={onLogMovie}
                onTrailerClick={handleOpenTrailer}
                onClick={onSelectMovie}
              />
            ))}
          </div>
        </section>

        {/* Row 4: "Top Rated Classics" */}
        <section className="bb-swimlane">
          <div className="bb-swimlane-header">
            <div className="bb-swimlane-title-group">
              <h3 className="bb-swimlane-title">
                <Trophy size={22} color="var(--accent-gold)" /> Top Rated Classics
              </h3>
              <span className="bb-swimlane-subtitle">
                The highest-rated cinematic masterworks of all time
              </span>
            </div>

            <div className="bb-swimlane-controls">
              <button
                className="bb-arrow-btn"
                onClick={() => scrollTrack(topRatedTrackRef, 'left')}
                title="Scroll Left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="bb-arrow-btn"
                onClick={() => scrollTrack(topRatedTrackRef, 'right')}
                title="Scroll Right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div ref={topRatedTrackRef} className="bb-swimlane-track">
            {topRatedMovies.map((movie) => (
              <MovieCard
                key={`toprated-${movie.tmdb_id}`}
                movie={movie}
                onLogClick={onLogMovie}
                onTrailerClick={handleOpenTrailer}
                onClick={onSelectMovie}
              />
            ))}
          </div>
        </section>

        {/* Row 5: "Explore Full Catalogue" with Genre Pills & Decade Filter */}
        <section style={{ marginTop: '3rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h3 className="bb-swimlane-title">
                <Compass size={22} color="var(--accent-cyan)" /> Explore Full Catalogue
              </h3>
              <span className="bb-swimlane-subtitle">
                Filter by genre and release decade to unearth hidden cinematic gems
              </span>
            </div>

            {/* Decade Dropdown Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <select
                value={selectedYear || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedYear(val === 0 ? null : val);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {DECADES.map((d) => (
                  <option key={d.value} value={d.value} style={{ background: '#0e1118', color: '#fff' }}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliding Genre Pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.75rem',
              marginBottom: '1.25rem',
              scrollbarWidth: 'none'
            }}
          >
            <button
              onClick={() => setSelectedGenre(null)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: selectedGenre === null ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: selectedGenre === null ? '#06070a' : 'var(--text-secondary)',
                border: selectedGenre === null ? 'none' : '1px solid var(--border-subtle)'
              }}
            >
              All Genres
            </button>

            {STANDARD_GENRES.map((g) => {
              const isSelected = selectedGenre === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenre(isSelected ? null : g.id)}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    background: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#000000' : 'var(--text-secondary)',
                    border: isSelected ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  {g.name}
                </button>
              );
            })}
          </div>

          {/* Catalogue Grid */}
          {loadingCatalogue ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <Loader2 size={30} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-gold)' }} />
              <p>Loading catalogue...</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                  gap: '14px'
                }}
              >
                {catalogueMovies.map((movie) => (
                  <MovieCard
                    key={`cat-${movie.tmdb_id}`}
                    movie={movie}
                    onLogClick={onLogMovie}
                    onTrailerClick={handleOpenTrailer}
                    onClick={onSelectMovie}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {cataloguePage < totalCataloguePages && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <button
                    className="btn-bb-secondary"
                    onClick={handleLoadMoreCatalogue}
                    disabled={loadingMore}
                    style={{ padding: '0.75rem 2.5rem', fontSize: '0.92rem' }}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={16} className="spin" /> Loading More...
                      </>
                    ) : (
                      'Load More Titles'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Embedded Trailer Modal */}
      {activeTrailer && (
        <TrailerModal
          trailerKey={activeTrailer.key}
          title={activeTrailer.title}
          onClose={() => setActiveTrailer(null)}
        />
      )}
    </div>
  );
};
