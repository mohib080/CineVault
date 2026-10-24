import { Router, Request, Response } from 'express';
import { db } from '../config/db';
import { searchMoviesTMDB, getMovieDetailsTMDB, getCuratedPopular, TMDBMovie } from '../config/tmdb';
import { LETTERBOXD_CATALOG } from '../config/catalog';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Cache or update movie in movies table
export async function cacheMovie(movie: TMDBMovie): Promise<void> {
  try {
    await db.query(
      `INSERT INTO movies (tmdb_id, title, release_year, title_type, poster_path, backdrop_path, director, runtime, overview, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (tmdb_id) DO UPDATE SET
         title = EXCLUDED.title,
         release_year = COALESCE(EXCLUDED.release_year, movies.release_year),
         title_type = COALESCE(EXCLUDED.title_type, movies.title_type),
         poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path),
         backdrop_path = COALESCE(EXCLUDED.backdrop_path, movies.backdrop_path),
         director = COALESCE(EXCLUDED.director, movies.director),
         runtime = COALESCE(EXCLUDED.runtime, movies.runtime),
         overview = COALESCE(EXCLUDED.overview, movies.overview),
         rating = COALESCE(EXCLUDED.rating, movies.rating)`,
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
      } else {
        await db.query(
          `UPDATE movies SET 
             poster_path = COALESCE($1, poster_path),
             backdrop_path = COALESCE($2, backdrop_path),
             rating = COALESCE($3, rating)
           WHERE tmdb_id = $4`,
          [movie.poster_path || null, movie.backdrop_path || null, movie.rating || null, movie.tmdb_id]
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

// Search movies across local database (Letterboxd catalog + IMDb + cache) and external TMDB
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      // Return top films and series with real posters, ranked by rating
      const dbMovies = await db.query(
        `SELECT * FROM movies 
         WHERE poster_path IS NOT NULL AND poster_path != ''
         ORDER BY rating DESC, release_year DESC 
         LIMIT 80`
      );
      if (dbMovies.rows.length >= 10) {
        res.json({ results: dbMovies.rows });
      } else {
        res.json({ results: getCuratedPopular() });
      }
      return;
    }

    // 1. Search local database (fast query with intelligent Letterboxd-style ranking)
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
         rating DESC,
         release_year DESC 
       LIMIT 40`,
      [`%${cleanQ}%`, cleanQ, `${cleanQ}%`]
    );

    let combined: any[] = [...dbResults.rows];

    // 2. Also search TMDB if key is configured, or filter catalog
    try {
      const tmdbResults = await searchMoviesTMDB(query);
      for (const m of tmdbResults) {
        if (!combined.some((c) => c.tmdb_id === m.tmdb_id)) {
          combined.push(m);
          cacheMovie(m).catch(() => {});
        }
      }
    } catch {
      // ignore tmdb search failures
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
       ORDER BY rating DESC, release_year DESC 
       LIMIT 80`
    );

    if (dbMovies.rows.length >= 20) {
      res.json({ results: dbMovies.rows });
    } else {
      await seedCatalog();
      const updated = await db.query(
        `SELECT * FROM movies 
         WHERE poster_path IS NOT NULL AND poster_path != ''
         ORDER BY rating DESC, release_year DESC 
         LIMIT 80`
      );
      res.json({ results: updated.rows.length > 0 ? updated.rows : getCuratedPopular() });
    }
  } catch (err: any) {
    console.error('Popular movies error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch popular movies.' });
  }
});

// Single movie details & user's personal log history
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

    if (!movie || !movie.poster_path) {
      const fetched = await getMovieDetailsTMDB(tmdbId);
      if (fetched) {
        await cacheMovie(fetched);
        movie = { ...movie, ...fetched };
      }
    }

    if (!movie) {
      res.status(404).json({ error: 'Not Found', message: 'Movie not found.' });
      return;
    }

    // If authenticated, get user's personal logs for this movie
    let userLogs: any[] = [];
    if (req.user) {
      const logs = await db.query(
        `SELECT id, rating, review_text, watched_date, is_rewatch, contains_spoilers, visibility, share_token, created_at
         FROM diary_entries
         WHERE user_id = $1 AND tmdb_id = $2
         ORDER BY watched_date DESC, created_at DESC`,
        [req.user.id, tmdbId]
      );
      userLogs = logs.rows;
    }

    // Fetch public community reviews for this movie
    const communityLogs = await db.query(
      `SELECT d.id, d.rating, d.review_text, d.watched_date, d.is_rewatch, d.contains_spoilers, d.created_at,
              u.username
       FROM diary_entries d
       JOIN users u ON d.user_id = u.id
       WHERE d.tmdb_id = $1 AND d.visibility = 'PUBLIC'
       ORDER BY d.watched_date DESC, d.created_at DESC
       LIMIT 10`,
      [tmdbId]
    );

    res.json({
      movie,
      userLogs,
      communityLogs: communityLogs.rows
    });
  } catch (err: any) {
    console.error('Movie detail error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch movie details.' });
  }
});

export default router;
