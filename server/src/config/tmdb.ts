import { LETTERBOXD_CATALOG, CatalogItem } from './catalog';

export interface TMDBMovie {
  tmdb_id: number;
  title: string;
  release_year?: number;
  title_type?: string;
  poster_path?: string;
  backdrop_path?: string;
  director?: string;
  runtime?: number;
  overview?: string;
  rating?: number;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function searchMoviesTMDB(query: string): Promise<TMDBMovie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const url = `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];
        return results
          .filter((m: any) => m.media_type === 'movie' || m.media_type === 'tv')
          .map((m: any) => ({
            tmdb_id: m.id,
            title: m.title || m.name,
            release_year: m.release_date
              ? parseInt(m.release_date.split('-')[0], 10)
              : m.first_air_date
              ? parseInt(m.first_air_date.split('-')[0], 10)
              : undefined,
            title_type: m.media_type === 'tv' ? 'series' : 'movie',
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            overview: m.overview,
            rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined
          }));
      }
    } catch (err) {
      console.warn('TMDB search request failed, falling back to local dataset:', err);
    }
  }

  // Fallback to local high-quality Letterboxd catalog
  const q = query.toLowerCase().trim();
  if (!q) return LETTERBOXD_CATALOG;
  return LETTERBOXD_CATALOG.filter((m) =>
    m.title.toLowerCase().includes(q) ||
    (m.director && m.director.toLowerCase().includes(q)) ||
    (m.overview && m.overview.toLowerCase().includes(q))
  );
}

export async function getMovieDetailsTMDB(tmdbId: number): Promise<TMDBMovie | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      // First try movie
      let url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
      let response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const directorObj = data.credits?.crew?.find((c: any) => c.job === 'Director');
        return {
          tmdb_id: data.id,
          title: data.title,
          release_year: data.release_date ? parseInt(data.release_date.split('-')[0], 10) : undefined,
          title_type: 'movie',
          poster_path: data.poster_path,
          backdrop_path: data.backdrop_path,
          director: directorObj ? directorObj.name : 'Unknown',
          runtime: data.runtime || undefined,
          overview: data.overview,
          rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : undefined
        };
      }

      // If not movie, try tv
      url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
      response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const creatorObj = data.created_by?.[0]?.name;
        return {
          tmdb_id: data.id,
          title: data.name,
          release_year: data.first_air_date ? parseInt(data.first_air_date.split('-')[0], 10) : undefined,
          title_type: 'series',
          poster_path: data.poster_path,
          backdrop_path: data.backdrop_path,
          director: creatorObj || 'TV Series',
          runtime: data.episode_run_time?.[0] || undefined,
          overview: data.overview,
          rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : undefined
        };
      }
    } catch (err) {
      console.warn(`TMDB title fetch for ${tmdbId} failed, checking local dataset:`, err);
    }
  }

  const found = LETTERBOXD_CATALOG.find((m) => m.tmdb_id === tmdbId);
  return found || null;
}

export function getCuratedPopular(): TMDBMovie[] {
  return LETTERBOXD_CATALOG;
}
