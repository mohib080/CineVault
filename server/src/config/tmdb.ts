export interface TMDBMovie {
  tmdb_id: number;
  title: string;
  release_year?: number;
  poster_path?: string;
  backdrop_path?: string;
  director?: string;
  runtime?: number;
  overview?: string;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Curated high quality seed data for offline / zero-API-key instant functionality
const CURATED_MOVIES: TMDBMovie[] = [
  {
    tmdb_id: 872585,
    title: 'Oppenheimer',
    release_year: 2023,
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
    director: 'Christopher Nolan',
    runtime: 181,
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.'
  },
  {
    tmdb_id: 693134,
    title: 'Dune: Part Two',
    release_year: 2024,
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5200FR.jpg',
    director: 'Denis Villeneuve',
    runtime: 166,
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.'
  },
  {
    tmdb_id: 157336,
    title: 'Interstellar',
    release_year: 2014,
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    director: 'Christopher Nolan',
    runtime: 169,
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.'
  },
  {
    tmdb_id: 496243,
    title: 'Parasite',
    release_year: 2019,
    poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop_path: '/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg',
    director: 'Bong Joon-ho',
    runtime: 132,
    overview: 'All unemployed, Ki-taek\'s family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.'
  },
  {
    tmdb_id: 129,
    title: 'Spirited Away',
    release_year: 2001,
    poster_path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdrop_path: '/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
    director: 'Hayao Miyazaki',
    runtime: 125,
    overview: 'A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.'
  },
  {
    tmdb_id: 238,
    title: 'The Godfather',
    release_year: 1972,
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    director: 'Francis Ford Coppola',
    runtime: 175,
    overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps up to take care of the would-be killers.'
  },
  {
    tmdb_id: 335984,
    title: 'Blade Runner 2049',
    release_year: 2017,
    poster_path: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdrop_path: '/ilRyASDvt7vcrRjzUYsQ4h5wQ1Q.jpg',
    director: 'Denis Villeneuve',
    runtime: 164,
    overview: 'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos.'
  },
  {
    tmdb_id: 244786,
    title: 'Whiplash',
    release_year: 2014,
    poster_path: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    backdrop_path: '/6bbZ6XyvgfjhQwfplEdgvnFrBum.jpg',
    director: 'Damien Chazelle',
    runtime: 107,
    overview: 'Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.'
  },
  {
    tmdb_id: 545611,
    title: 'Everything Everywhere All at Once',
    release_year: 2022,
    poster_path: '/w3LxiVYPqrlrIqY0UCmpqaYemKp.jpg',
    backdrop_path: '/707thQ48gJqjXkrtwH0o73v00aB.jpg',
    director: 'Daniel Kwan, Daniel Scheinert',
    runtime: 139,
    overview: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save what\'s important to her by connecting with the lives she could have led in other universes.'
  },
  {
    tmdb_id: 27205,
    title: 'Inception',
    release_year: 2010,
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    director: 'Christopher Nolan',
    runtime: 148,
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".'
  }
];

export async function searchMoviesTMDB(query: string): Promise<TMDBMovie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];
        return results.map((m: any) => ({
          tmdb_id: m.id,
          title: m.title,
          release_year: m.release_date ? parseInt(m.release_date.split('-')[0], 10) : undefined,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          overview: m.overview
        }));
      }
    } catch (err) {
      console.warn('TMDB search request failed, falling back to local dataset:', err);
    }
  }

  // Fallback / mock filter
  const q = query.toLowerCase().trim();
  if (!q) return CURATED_MOVIES;
  return CURATED_MOVIES.filter((m) =>
    m.title.toLowerCase().includes(q) ||
    (m.director && m.director.toLowerCase().includes(q))
  );
}

export async function getMovieDetailsTMDB(tmdbId: number): Promise<TMDBMovie | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const directorObj = data.credits?.crew?.find((c: any) => c.job === 'Director');
        return {
          tmdb_id: data.id,
          title: data.title,
          release_year: data.release_date ? parseInt(data.release_date.split('-')[0], 10) : undefined,
          poster_path: data.poster_path,
          backdrop_path: data.backdrop_path,
          director: directorObj ? directorObj.name : 'Unknown',
          runtime: data.runtime || undefined,
          overview: data.overview
        };
      }
    } catch (err) {
      console.warn(`TMDB movie fetch for ${tmdbId} failed, checking local dataset:`, err);
    }
  }

  const found = CURATED_MOVIES.find((m) => m.tmdb_id === tmdbId);
  return found || null;
}

export function getCuratedPopular(): TMDBMovie[] {
  return CURATED_MOVIES;
}
