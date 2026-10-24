import { LETTERBOXD_CATALOG } from './catalog';

export interface GenreItem {
  id: number;
  name: string;
}

export interface CastMember {
  person_id: number;
  name: string;
  profile_path?: string;
  character_name?: string;
  billing_order?: number;
}

export interface CrewMember {
  person_id: number;
  name: string;
  profile_path?: string;
  job: string;
}

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
  tagline?: string;
  vote_average?: number;
  rating?: number;
  trailer_key?: string;
  genres?: GenreItem[];
  cast?: CastMember[];
  crew?: CrewMember[];
  similar?: TMDBMovie[];
}

export interface PersonCredit {
  tmdb_id: number;
  title: string;
  release_year?: number;
  poster_path?: string;
  character_name?: string;
  job?: string;
  credit_type: 'cast' | 'crew';
  rating?: number;
  watched?: boolean;
  user_rating?: number;
}

export interface PersonDetail {
  person_id: number;
  name: string;
  biography?: string;
  profile_path?: string;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
  cast_credits: PersonCredit[];
  crew_credits: PersonCredit[];
  stats: {
    total_films: number;
    watched_films: number;
    percent_watched: number;
  };
}

export const TMDB_GENRES: GenreItem[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function extractTrailerKey(videos: any): string | undefined {
  if (!videos || !videos.results || !Array.isArray(videos.results)) return undefined;
  const youtubeVideos = videos.results.filter((v: any) => v.site === 'YouTube');
  const officialTrailer = youtubeVideos.find((v: any) => v.type === 'Trailer' && v.official);
  if (officialTrailer) return officialTrailer.key;
  const anyTrailer = youtubeVideos.find((v: any) => v.type === 'Trailer');
  if (anyTrailer) return anyTrailer.key;
  const teaser = youtubeVideos.find((v: any) => v.type === 'Teaser' || v.type === 'Clip');
  if (teaser) return teaser.key;
  return youtubeVideos[0]?.key;
}

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
            vote_average: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined,
            rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined
          }));
      }
    } catch (err) {
      console.warn('TMDB search request failed, falling back to local dataset:', err);
    }
  }

  // Fallback to local catalog
  const q = query.toLowerCase().trim();
  if (!q) return LETTERBOXD_CATALOG;
  return LETTERBOXD_CATALOG.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      (m.director && m.director.toLowerCase().includes(q)) ||
      (m.overview && m.overview.toLowerCase().includes(q))
  );
}

export async function discoverMoviesTMDB(
  category: string = 'trending',
  page: number = 1,
  genre?: number,
  year?: number
): Promise<{ results: TMDBMovie[]; page: number; total_pages: number; total_results: number }> {
  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      let endpoint = '';
      const params = new URLSearchParams({
        api_key: apiKey,
        page: page.toString(),
        include_adult: 'false'
      });

      if (genre) params.append('with_genres', genre.toString());
      if (year) params.append('primary_release_year', year.toString());

      if (category === 'trending' && !genre && !year) {
        endpoint = `${TMDB_BASE_URL}/trending/movie/week?${params.toString()}`;
      } else if (category === 'top_rated' && !genre && !year) {
        endpoint = `${TMDB_BASE_URL}/movie/top_rated?${params.toString()}`;
      } else if (category === 'upcoming' && !genre && !year) {
        endpoint = `${TMDB_BASE_URL}/movie/upcoming?${params.toString()}`;
      } else if (category === 'popular' && !genre && !year) {
        endpoint = `${TMDB_BASE_URL}/movie/popular?${params.toString()}`;
      } else {
        // Use discover endpoint with sorting
        const sortBy =
          category === 'top_rated'
            ? 'vote_average.desc'
            : category === 'upcoming'
            ? 'primary_release_date.desc'
            : 'popularity.desc';
        params.append('sort_by', sortBy);
        if (category === 'top_rated') params.append('vote_count.gte', '300');
        endpoint = `${TMDB_BASE_URL}/discover/movie?${params.toString()}`;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const results = (data.results || []).map((m: any) => ({
          tmdb_id: m.id,
          title: m.title || m.name,
          release_year: m.release_date
            ? parseInt(m.release_date.split('-')[0], 10)
            : m.first_air_date
            ? parseInt(m.first_air_date.split('-')[0], 10)
            : undefined,
          title_type: 'movie',
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          overview: m.overview,
          vote_average: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined,
          rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined
        }));

        return {
          results,
          page: data.page || page,
          total_pages: Math.min(data.total_pages || 1, 500),
          total_results: data.total_results || results.length
        };
      }
    } catch (err) {
      console.warn('TMDB discover error, falling back to local database:', err);
    }
  }

  // Graceful offline fallback from LETTERBOXD_CATALOG
  let pool = [...LETTERBOXD_CATALOG];
  if (year) {
    pool = pool.filter((m) => m.release_year === year);
  }
  if (category === 'top_rated') {
    pool.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (category === 'upcoming') {
    pool.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
  }

  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const pageResults = pool.slice(startIndex, startIndex + pageSize);

  return {
    results: pageResults,
    page,
    total_pages: Math.ceil(pool.length / pageSize) || 1,
    total_results: pool.length
  };
}

export async function getFullMovieDetailsTMDB(tmdbId: number): Promise<TMDBMovie | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      // 1. First try /movie/{id} with credits, videos, similar
      let url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits,videos,similar`;
      let response = await fetch(url);
      let isTv = false;

      if (!response.ok) {
        // Fallback to /tv/{id}
        url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${apiKey}&append_to_response=credits,videos,similar`;
        response = await fetch(url);
        isTv = true;
      }

      if (response.ok) {
        const data = await response.json();
        const directorObj = data.credits?.crew?.find(
          (c: any) => c.job === 'Director' || c.job === 'Series Director' || c.job === 'Executive Producer'
        );
        const creator = data.created_by?.[0]?.name;

        // Extract Cast (top 15)
        const cast: CastMember[] = (data.credits?.cast || []).slice(0, 18).map((c: any, idx: number) => ({
          person_id: c.id,
          name: c.name,
          profile_path: c.profile_path,
          character_name: c.character,
          billing_order: c.order !== undefined ? c.order : idx
        }));

        // Extract key Crew
        const crew: CrewMember[] = (data.credits?.crew || [])
          .filter((c: any) =>
            ['Director', 'Writer', 'Screenplay', 'Producer', 'Director of Photography', 'Original Music Composer'].includes(
              c.job
            )
          )
          .slice(0, 10)
          .map((c: any) => ({
            person_id: c.id,
            name: c.name,
            profile_path: c.profile_path,
            job: c.job
          }));

        // Extract Genres
        const genres: GenreItem[] = (data.genres || []).map((g: any) => ({
          id: g.id,
          name: g.name
        }));

        // Extract Similar
        const similar: TMDBMovie[] = (data.similar?.results || []).slice(0, 10).map((m: any) => ({
          tmdb_id: m.id,
          title: m.title || m.name,
          release_year: m.release_date
            ? parseInt(m.release_date.split('-')[0], 10)
            : m.first_air_date
            ? parseInt(m.first_air_date.split('-')[0], 10)
            : undefined,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined,
          vote_average: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined
        }));

        const trailer_key = extractTrailerKey(data.videos);

        return {
          tmdb_id: data.id,
          title: data.title || data.name,
          release_year: data.release_date
            ? parseInt(data.release_date.split('-')[0], 10)
            : data.first_air_date
            ? parseInt(data.first_air_date.split('-')[0], 10)
            : undefined,
          title_type: isTv ? 'series' : 'movie',
          poster_path: data.poster_path,
          backdrop_path: data.backdrop_path,
          director: directorObj ? directorObj.name : creator || (isTv ? 'TV Series' : 'Unknown'),
          runtime: data.runtime || data.episode_run_time?.[0] || undefined,
          overview: data.overview,
          tagline: data.tagline || undefined,
          vote_average: data.vote_average ? Math.round(data.vote_average * 10) / 10 : undefined,
          rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : undefined,
          trailer_key,
          genres,
          cast,
          crew,
          similar
        };
      }
    } catch (err) {
      console.warn(`TMDB full details fetch for ${tmdbId} failed:`, err);
    }
  }

  // Fallback to local catalog
  const found = LETTERBOXD_CATALOG.find((m) => m.tmdb_id === tmdbId);
  if (!found) return null;

  return {
    ...found,
    genres: [
      { id: 18, name: 'Drama' },
      { id: 878, name: 'Sci-Fi' }
    ],
    cast: [
      { person_id: 101, name: 'Lead Actor', character_name: 'Protagonist', billing_order: 1 },
      { person_id: 102, name: 'Supporting Star', character_name: 'Companion', billing_order: 2 }
    ],
    crew: [
      { person_id: 201, name: found.director || 'Director', job: 'Director' }
    ],
    similar: LETTERBOXD_CATALOG.filter((m) => m.tmdb_id !== tmdbId).slice(0, 6)
  };
}

export async function getPersonDetailsTMDB(personId: number): Promise<PersonDetail | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const url = `${TMDB_BASE_URL}/person/${personId}?api_key=${apiKey}&append_to_response=combined_credits`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const castCredits: PersonCredit[] = (data.combined_credits?.cast || [])
          .filter((c: any) => c.poster_path)
          .map((c: any) => ({
            tmdb_id: c.id,
            title: c.title || c.name,
            release_year: c.release_date
              ? parseInt(c.release_date.split('-')[0], 10)
              : c.first_air_date
              ? parseInt(c.first_air_date.split('-')[0], 10)
              : undefined,
            poster_path: c.poster_path,
            character_name: c.character,
            credit_type: 'cast',
            rating: c.vote_average ? Math.round(c.vote_average * 10) / 10 : undefined
          }))
          .sort((a: any, b: any) => (b.release_year || 0) - (a.release_year || 0));

        const crewCredits: PersonCredit[] = (data.combined_credits?.crew || [])
          .filter((c: any) => c.poster_path && ['Director', 'Writer', 'Screenplay', 'Producer'].includes(c.job))
          .map((c: any) => ({
            tmdb_id: c.id,
            title: c.title || c.name,
            release_year: c.release_date
              ? parseInt(c.release_date.split('-')[0], 10)
              : c.first_air_date
              ? parseInt(c.first_air_date.split('-')[0], 10)
              : undefined,
            poster_path: c.poster_path,
            job: c.job,
            credit_type: 'crew',
            rating: c.vote_average ? Math.round(c.vote_average * 10) / 10 : undefined
          }))
          .sort((a: any, b: any) => (b.release_year || 0) - (a.release_year || 0));

        // Deduplicate credits by tmdb_id
        const uniqueCast = castCredits.filter((v, i, a) => a.findIndex((t) => t.tmdb_id === v.tmdb_id) === i);
        const uniqueCrew = crewCredits.filter((v, i, a) => a.findIndex((t) => t.tmdb_id === v.tmdb_id) === i);

        return {
          person_id: data.id,
          name: data.name,
          biography: data.biography,
          profile_path: data.profile_path,
          birthday: data.birthday,
          place_of_birth: data.place_of_birth,
          known_for_department: data.known_for_department,
          cast_credits: uniqueCast,
          crew_credits: uniqueCrew,
          stats: {
            total_films: uniqueCast.length + uniqueCrew.length,
            watched_films: 0,
            percent_watched: 0
          }
        };
      }
    } catch (err) {
      console.warn(`TMDB person fetch for ${personId} failed:`, err);
    }
  }

  // Fallback for offline demo
  return {
    person_id: personId,
    name: 'Film Artist',
    biography: 'Renowned filmmaker and contributor to world cinema.',
    known_for_department: 'Directing',
    cast_credits: [],
    crew_credits: LETTERBOXD_CATALOG.slice(0, 8).map((m) => ({
      tmdb_id: m.tmdb_id,
      title: m.title,
      release_year: m.release_year,
      poster_path: m.poster_path,
      job: 'Director',
      credit_type: 'crew',
      rating: m.rating
    })),
    stats: {
      total_films: 8,
      watched_films: 0,
      percent_watched: 0
    }
  };
}

export function getCuratedPopular(): TMDBMovie[] {
  return LETTERBOXD_CATALOG;
}

export async function searchPeopleTMDB(query: string): Promise<Array<{
  id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
}>> {
  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    try {
      const url = `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          profile_path: p.profile_path,
          known_for_department: p.known_for_department
        }));
      }
    } catch (err) {
      console.warn('TMDB person search failed:', err);
    }
  }

  // Fallback
  const q = query.toLowerCase().trim();
  const directors = [
    { id: 525, name: 'Christopher Nolan', known_for_department: 'Directing' },
    { id: 137427, name: 'Denis Villeneuve', known_for_department: 'Directing' },
    { id: 1032, name: 'Martin Scorsese', known_for_department: 'Directing' },
    { id: 138, name: 'Quentin Tarantino', known_for_department: 'Directing' },
    { id: 7467, name: 'David Fincher', known_for_department: 'Directing' },
    { id: 2034, name: 'Cillian Murphy', known_for_department: 'Acting' },
    { id: 1190668, name: 'Timothée Chalamet', known_for_department: 'Acting' }
  ];
  return directors.filter((d) => d.name.toLowerCase().includes(q));
}

