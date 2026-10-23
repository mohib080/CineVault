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
  },
  {
    tmdb_id: 278,
    title: 'The Shawshank Redemption',
    release_year: 1994,
    poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    director: 'Frank Darabont',
    runtime: 142,
    overview: 'Imprisoned in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.'
  },
  {
    tmdb_id: 155,
    title: 'The Dark Knight',
    release_year: 2008,
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    director: 'Christopher Nolan',
    runtime: 152,
    overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent, but finds himself up against the Joker.'
  },
  {
    tmdb_id: 680,
    title: 'Pulp Fiction',
    release_year: 1994,
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop_path: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    director: 'Quentin Tarantino',
    runtime: 154,
    overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in four tales of violence and redemption.'
  },
  {
    tmdb_id: 550,
    title: 'Fight Club',
    release_year: 1999,
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    director: 'David Fincher',
    runtime: 139,
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.'
  },
  {
    tmdb_id: 769,
    title: 'GoodFellas',
    release_year: 1990,
    poster_path: '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
    backdrop_path: '/sw7mordbZxgITU877yTpZCud90M.jpg',
    director: 'Martin Scorsese',
    runtime: 145,
    overview: 'The true story of Henry Hill, a half-Irish, half-Sicilian boy in New York who grows up in the mob and works his way up through the ranks.'
  },
  {
    tmdb_id: 603,
    title: 'The Matrix',
    release_year: 1999,
    poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdrop_path: '/7u3AGqiSlDlYXYrrqtIlHESiOxp.jpg',
    director: 'Lana Wachowski, Lilly Wachowski',
    runtime: 136,
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who learns from mysterious rebels about the true nature of his reality.'
  },
  {
    tmdb_id: 346,
    title: 'Seven Samurai',
    release_year: 1954,
    poster_path: '/8OKm79FR4FDNUJuCrURW0BPvTBu.jpg',
    backdrop_path: '/7t04R44h01xP4J80rR0N5GvM35v.jpg',
    director: 'Akira Kurosawa',
    runtime: 207,
    overview: 'A samurai answers a village\'s request for protection after he falls on hard times. The town needs protection from bandits, so the samurai gathers six others to help him teach the people how to defend themselves.'
  },
  {
    tmdb_id: 598,
    title: 'City of God',
    release_year: 2002,
    poster_path: '/k7eYdWvhYQ7RQoU2TB2AcL9z935.jpg',
    backdrop_path: '/mktkLzF9Z13tW9bU0oIe2q45gD1.jpg',
    director: 'Fernando Meirelles, Kátia Lund',
    runtime: 130,
    overview: 'In the slums of Rio, two kids\' paths diverge as one struggles to become a photographer and the other a kingpin.'
  },
  {
    tmdb_id: 289,
    title: 'Casablanca',
    release_year: 1942,
    poster_path: '/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg',
    backdrop_path: '/kbv1P3p803f2L47yR4u3M6u7p0t.jpg',
    director: 'Michael Curtiz',
    runtime: 102,
    overview: 'A cynical expatriate American cafe owner struggles to decide whether or not to help his former lover and her fugitive husband escape the Nazis in French Morocco.'
  },
  {
    tmdb_id: 539,
    title: 'Psycho',
    release_year: 1960,
    poster_path: '/yz45KMrAQBtmu5drQDES3Zq9aeo.jpg',
    backdrop_path: '/4u04e8dZ8p7J7b8m9k6eL1n3m2c.jpg',
    director: 'Alfred Hitchcock',
    runtime: 109,
    overview: 'When fugitive clerk Marion Crane arrives at a secluded motel, she meets a reclusive man under the control of his mother.'
  },
  {
    tmdb_id: 348,
    title: 'Alien',
    release_year: 1979,
    poster_path: '/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg',
    backdrop_path: '/AmR3JG1DYz5umgKw7iS0m1v1f1o.jpg',
    director: 'Ridley Scott',
    runtime: 117,
    overview: 'During its return voyage, the commercial starship Nostromo intercepts a distress signal from a distant moon and discovers an aggressive predatory extraterrestrial organism.'
  },
  {
    tmdb_id: 274,
    title: 'The Silence of the Lambs',
    release_year: 1991,
    poster_path: '/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg',
    backdrop_path: '/6bbZ6XyvgfjhQwfplEdgvnFrBum.jpg',
    director: 'Jonathan Demme',
    runtime: 118,
    overview: 'Clarice Starling, a top student at the FBI\'s training academy, is interviewed by Jack Crawford to investigate the psychotic serial killer known only as Buffalo Bill.'
  },
  {
    tmdb_id: 120,
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    release_year: 2001,
    poster_path: '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
    backdrop_path: '/vRQnzOn4H1vt6irSafMMRpPXqqC.jpg',
    director: 'Peter Jackson',
    runtime: 178,
    overview: 'Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home behind in order to begin an epic quest to the Cracks of Doom.'
  },
  {
    tmdb_id: 76341,
    title: 'Mad Max: Fury Road',
    release_year: 2015,
    poster_path: '/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
    backdrop_path: '/nlCHUW2Y9XWbuR2nn7Y9csZGAA3.jpg',
    director: 'George Miller',
    runtime: 120,
    overview: 'An apocalyptic story set in the furthest reaches of our planet, in a stark desert landscape where humanity is broken, and most everyone is crazed fighting for the necessities of life.'
  },
  {
    tmdb_id: 324857,
    title: 'Spider-Man: Into the Spider-Verse',
    release_year: 2018,
    poster_path: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
    backdrop_path: '/7d6Zje027vRkWtB5GqG0K1j5p0V.jpg',
    director: 'Bob Persichetti, Peter Ramsey, Rodney Rothman',
    runtime: 117,
    overview: 'Struggling to find his place in the world while juggling school and family, Brooklyn teenager Miles Morales is bitten by a radioactive spider and discovers superhero abilities.'
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
