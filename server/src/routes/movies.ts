import { Router, Request, Response } from 'express';
import { db } from '../config/db';
import { searchMoviesTMDB, getMovieDetailsTMDB, getCuratedPopular, TMDBMovie } from '../config/tmdb';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Cache or update movie in movies table
export async function cacheMovie(movie: TMDBMovie): Promise<void> {
  try {
    await db.query(
      `INSERT INTO movies (tmdb_id, title, release_year, poster_path, backdrop_path, director, runtime, overview)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (tmdb_id) DO UPDATE SET
         title = EXCLUDED.title,
         release_year = COALESCE(EXCLUDED.release_year, movies.release_year),
         poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path),
         backdrop_path = COALESCE(EXCLUDED.backdrop_path, movies.backdrop_path),
         director = COALESCE(EXCLUDED.director, movies.director),
         runtime = COALESCE(EXCLUDED.runtime, movies.runtime),
         overview = COALESCE(EXCLUDED.overview, movies.overview)`,
      [
        movie.tmdb_id,
        movie.title,
        movie.release_year || null,
        movie.poster_path || null,
        movie.backdrop_path || null,
        movie.director || null,
        movie.runtime || null,
        movie.overview || null
      ]
    );
  } catch (err) {
    // If table doesn't support ON CONFLICT (like basic SQLite statement fallback), do check-insert
    try {
      const existing = await db.query('SELECT tmdb_id FROM movies WHERE tmdb_id = $1', [movie.tmdb_id]);
      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO movies (tmdb_id, title, release_year, poster_path, backdrop_path, director, runtime, overview)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            movie.tmdb_id,
            movie.title,
            movie.release_year || null,
            movie.poster_path || null,
            movie.backdrop_path || null,
            movie.director || null,
            movie.runtime || null,
            movie.overview || null
          ]
        );
      }
    } catch (fallbackErr) {
      console.warn('Cache movie fallback note:', fallbackErr);
    }
  }
}

// Search movies
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json({ results: getCuratedPopular() });
      return;
    }

    const results = await searchMoviesTMDB(query);

    // Cache top results asynchronously
    for (const m of results.slice(0, 5)) {
      cacheMovie(m).catch(() => {});
    }

    res.json({ results });
  } catch (err: any) {
    console.error('Movie search error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to search movies.' });
  }
});

// Popular / Trending movies
router.get('/popular', async (_req: Request, res: Response): Promise<void> => {
  try {
    const movies = getCuratedPopular();
    for (const m of movies) {
      cacheMovie(m).catch(() => {});
    }
    res.json({ results: movies });
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

    if (!movie) {
      const fetched = await getMovieDetailsTMDB(tmdbId);
      if (fetched) {
        await cacheMovie(fetched);
        movie = fetched;
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
