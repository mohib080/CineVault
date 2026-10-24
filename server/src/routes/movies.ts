import { Router, Request, Response } from 'express';
import { db } from '../config/db';
import {
  searchMoviesTMDB,
  getFullMovieDetailsTMDB,
  discoverMoviesTMDB,
  getCuratedPopular,
  TMDBMovie,
  TMDB_GENRES
} from '../config/tmdb';
import { LETTERBOXD_CATALOG } from '../config/catalog';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Cache or update movie in movies table and relational tables
export async function cacheMovie(movie: TMDBMovie): Promise<void> {
  try {
    await db.query(
      `INSERT INTO movies (
         tmdb_id, title, release_year, title_type, poster_path, backdrop_path,
         director, runtime, overview, tagline, vote_average, trailer_key, rating, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
       ON CONFLICT (tmdb_id) DO UPDATE SET
         title = EXCLUDED.title,
         release_year = COALESCE(EXCLUDED.release_year, movies.release_year),
         title_type = COALESCE(EXCLUDED.title_type, movies.title_type),
         poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path),
         backdrop_path = COALESCE(EXCLUDED.backdrop_path, movies.backdrop_path),
         director = COALESCE(EXCLUDED.director, movies.director),
         runtime = COALESCE(EXCLUDED.runtime, movies.runtime),
         overview = COALESCE(EXCLUDED.overview, movies.overview),
         tagline = COALESCE(EXCLUDED.tagline, movies.tagline),
         vote_average = COALESCE(EXCLUDED.vote_average, movies.vote_average),
         trailer_key = COALESCE(EXCLUDED.trailer_key, movies.trailer_key),
         rating = COALESCE(EXCLUDED.rating, movies.rating),
         updated_at = CURRENT_TIMESTAMP`,
      [
        movie.tmdb_id,
        movie.title,
        movie.release_year || null,
        movie.title_type || 'movie',
        movie.poster_path || null,
        movie.backdrop_path || null,
        movie.director || null,
        movie.runtime || null,
        movie.overview || null,
        movie.tagline || null,
        movie.vote_average || movie.rating || null,
        movie.trailer_key || null,
        movie.rating || movie.vote_average || null
      ]
    );

    // Cache relational genres if available
    if (movie.genres && movie.genres.length > 0) {
      for (const g of movie.genres) {
        try {
          await db.query(
            `INSERT INTO genres (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
            [g.id, g.name]
          );
          await db.query(
            `INSERT INTO movie_genres (tmdb_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [movie.tmdb_id, g.id]
          );
        } catch {
          // Ignore unique constraints
        }
      }
    }

    // Cache relational cast if available
    if (movie.cast && movie.cast.length > 0) {
      for (const c of movie.cast) {
        try {
          await db.query(
            `INSERT INTO people (person_id, name, profile_path) VALUES ($1, $2, $3)
             ON CONFLICT (person_id) DO UPDATE SET name = EXCLUDED.name, profile_path = COALESCE(EXCLUDED.profile_path, people.profile_path)`,
            [c.person_id, c.name, c.profile_path || null]
          );
          await db.query(
            `INSERT INTO movie_credits (tmdb_id, person_id, credit_type, character_name, job, billing_order)
             VALUES ($1, $2, 'cast', $3, 'Actor', $4)
             ON CONFLICT DO NOTHING`,
            [movie.tmdb_id, c.person_id, c.character_name || null, c.billing_order || 0]
          );
        } catch {
          // Ignore
        }
      }
    }

    // Cache relational crew if available
    if (movie.crew && movie.crew.length > 0) {
      for (const cr of movie.crew) {
        try {
          await db.query(
            `INSERT INTO people (person_id, name, profile_path) VALUES ($1, $2, $3)
             ON CONFLICT (person_id) DO UPDATE SET name = EXCLUDED.name, profile_path = COALESCE(EXCLUDED.profile_path, people.profile_path)`,
            [cr.person_id, cr.name, cr.profile_path || null]
          );
          await db.query(
            `INSERT INTO movie_credits (tmdb_id, person_id, credit_type, character_name, job, billing_order)
             VALUES ($1, $2, 'crew', NULL, $3, 0)
             ON CONFLICT DO NOTHING`,
            [movie.tmdb_id, cr.person_id, cr.job]
          );
        } catch {
          // Ignore
        }
      }
    }
  } catch (err) {
    try {
      const existing = await db.query('SELECT tmdb_id FROM movies WHERE tmdb_id = $1', [movie.tmdb_id]);
      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO movies (tmdb_id, title, release_year, title_type, poster_path, backdrop_path, director, runtime, overview, rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            movie.tmdb_id,
            movie.title,
            movie.release_year || null,
            movie.title_type || 'movie',
            movie.poster_path || null,
            movie.backdrop_path || null,
            movie.director || null,
            movie.runtime || null,
            movie.overview || null,
            movie.rating || null
          ]
        );
      }
    } catch (fallbackErr) {
      console.warn('Cache movie fallback note:', fallbackErr);
    }
  }
}

// Seed or update the Letterboxd catalog into the database
export async function seedCatalog(): Promise<void> {
  for (const item of LETTERBOXD_CATALOG) {
    try {
      await cacheMovie(item);
    } catch (e) {
      // ignore
    }
  }
}

// Run seed asynchronously on module load
seedCatalog().catch(() => {});

// Discover movies endpoint with dynamic categories, pagination, genres, and years
router.get('/discover', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = (req.query.category as string) || 'trending';
    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const genre = req.query.genre ? parseInt(req.query.genre as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

    const data = await discoverMoviesTMDB(category, page, genre, year);

    // Cache movies in background
    Promise.all(data.results.map((m) => cacheMovie(m))).catch(() => {});

    res.json(data);
  } catch (err: any) {
    console.error('Discover movies error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to discover movies.' });
  }
});

// Get genre list
router.get('/genres', async (_req: Request, res: Response): Promise<void> => {
  res.json({ genres: TMDB_GENRES });
});

// Search movies across local database (Letterboxd catalog + cache) and external TMDB
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      const dbMovies = await db.query(
        `SELECT * FROM movies 
         WHERE poster_path IS NOT NULL AND poster_path != ''
         ORDER BY COALESCE(vote_average, rating) DESC, release_year DESC 
         LIMIT 80`
      );
      if (dbMovies.rows.length >= 10) {
        res.json({ results: dbMovies.rows });
      } else {
        res.json({ results: getCuratedPopular() });
      }
      return;
    }

    const cleanQ = query.trim();
    const dbResults = await db.query(
      `SELECT * FROM movies 
       WHERE LOWER(title) LIKE LOWER($1) 
          OR LOWER(director) LIKE LOWER($1)
          OR LOWER(overview) LIKE LOWER($1)
       ORDER BY 
         (poster_path IS NOT NULL AND poster_path != '') DESC,
         CASE 
           WHEN LOWER(title) = LOWER($2) THEN 0
           WHEN LOWER(title) = LOWER('the ' || $2) THEN 0
           WHEN LOWER(title) LIKE LOWER($3) THEN 1
           WHEN LOWER(title) LIKE LOWER('the ' || $3) THEN 1
           ELSE 2 
         END,
         COALESCE(vote_average, rating) DESC,
         release_year DESC 
       LIMIT 40`,
      [`%${cleanQ}%`, cleanQ, `${cleanQ}%`]
    );

    let combined: any[] = [...dbResults.rows];

    // Search TMDB live
    try {
      const tmdbResults = await searchMoviesTMDB(query);
      for (const m of tmdbResults) {
        if (!combined.some((c) => c.tmdb_id === m.tmdb_id)) {
          combined.push(m);
          cacheMovie(m).catch(() => {});
        }
      }
    } catch {
      // ignore
    }

    res.json({ results: combined });
  } catch (err: any) {
    console.error('Movie search error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to search movies.' });
  }
});

// Popular / Trending movies & TV series
router.get('/popular', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbMovies = await db.query(
      `SELECT * FROM movies 
       WHERE poster_path IS NOT NULL AND poster_path != ''
       ORDER BY COALESCE(vote_average, rating) DESC, release_year DESC 
       LIMIT 80`
    );

    if (dbMovies.rows.length >= 20) {
      res.json({ results: dbMovies.rows });
    } else {
      await seedCatalog();
      const updated = await db.query(
        `SELECT * FROM movies 
         WHERE poster_path IS NOT NULL AND poster_path != ''
         ORDER BY COALESCE(vote_average, rating) DESC, release_year DESC 
         LIMIT 80`
      );
      res.json({ results: updated.rows.length > 0 ? updated.rows : getCuratedPopular() });
    }
  } catch (err: any) {
    console.error('Popular movies error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch popular movies.' });
  }
});

// Single movie details with lazy-hydration (credits, videos, similar, relational cast & crew)
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tmdbId = parseInt(req.params.id, 10);
    if (isNaN(tmdbId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid movie ID.' });
      return;
    }

    // Check local database cache
    const cached = await db.query('SELECT * FROM movies WHERE tmdb_id = $1', [tmdbId]);
    let movie = cached.rows[0];

    // Check if we need hydration (if movie not found or missing rich fields like trailer_key or overview)
    let richDetails: TMDBMovie | null = null;
    if (!movie || !movie.trailer_key || !movie.tagline) {
      richDetails = await getFullMovieDetailsTMDB(tmdbId);
      if (richDetails) {
        await cacheMovie(richDetails);
        const refreshed = await db.query('SELECT * FROM movies WHERE tmdb_id = $1', [tmdbId]);
        movie = refreshed.rows[0] || richDetails;
      }
    }

    if (!movie) {
      res.status(404).json({ error: 'Not Found', message: 'Movie not found.' });
      return;
    }

    // Query relational genres
    const genresRes = await db.query(
      `SELECT g.id, g.name 
       FROM genres g
       JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.tmdb_id = $1`,
      [tmdbId]
    );

    // Query relational cast
    const castRes = await db.query(
      `SELECT p.person_id, p.name, p.profile_path, mc.character_name, mc.billing_order
       FROM people p
       JOIN movie_credits mc ON p.person_id = mc.person_id
       WHERE mc.tmdb_id = $1 AND mc.credit_type = 'cast'
       ORDER BY mc.billing_order ASC
       LIMIT 20`,
      [tmdbId]
    );

    // Query relational crew
    const crewRes = await db.query(
      `SELECT p.person_id, p.name, p.profile_path, mc.job
       FROM people p
       JOIN movie_credits mc ON p.person_id = mc.person_id
       WHERE mc.tmdb_id = $1 AND mc.credit_type = 'crew'
       LIMIT 10`,
      [tmdbId]
    );

    // If authenticated, get user's personal logs for this movie
    let userLogs: any[] = [];
    if (req.user) {
      const logs = await db.query(
        `SELECT id, rating, review_text, watched_date, is_rewatch, contains_spoilers, liked, tags, visibility, share_token, created_at
         FROM diary_entries
         WHERE user_id = $1 AND tmdb_id = $2
         ORDER BY watched_date DESC, created_at DESC`,
        [req.user.id, tmdbId]
      );
      userLogs = logs.rows;
    }

    // Fetch public community reviews for this movie
    const communityLogs = await db.query(
      `SELECT d.id, d.rating, d.review_text, d.watched_date, d.is_rewatch, d.contains_spoilers, d.liked, d.tags, d.created_at,
              u.username
       FROM diary_entries d
       JOIN users u ON d.user_id = u.id
       WHERE d.tmdb_id = $1 AND d.visibility = 'PUBLIC'
       ORDER BY d.watched_date DESC, d.created_at DESC
       LIMIT 10`,
      [tmdbId]
    );

    // Similar movies fallback from catalog or live details
    const similar =
      richDetails?.similar ||
      LETTERBOXD_CATALOG.filter((m) => m.tmdb_id !== tmdbId).slice(0, 6);

    res.json({
      movie: {
        ...movie,
        genres: genresRes.rows.length > 0 ? genresRes.rows : richDetails?.genres || [],
        cast: castRes.rows.length > 0 ? castRes.rows : richDetails?.cast || [],
        crew: crewRes.rows.length > 0 ? crewRes.rows : richDetails?.crew || [],
        similar
      },
      userLogs,
      communityLogs: communityLogs.rows
    });
  } catch (err: any) {
    console.error('Movie detail error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch movie details.' });
  }
});

export default router;
