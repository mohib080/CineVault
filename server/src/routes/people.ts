import { Router, Request, Response } from 'express';
import { db } from '../config/db';
import { getPersonDetailsTMDB, searchPeopleTMDB } from '../config/tmdb';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/people/search?q=...
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      res.json({ results: [] });
      return;
    }
    const results = await searchPeopleTMDB(q.trim());
    res.json({ results });
  } catch (err: any) {
    console.error('Person search error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to search people.' });
  }
});

// GET /api/people/:personId
router.get('/:personId', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const personId = parseInt(req.params.personId, 10);
    if (isNaN(personId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid person ID.' });
      return;
    }

    // 1. Fetch person details and credits
    const personDetail = await getPersonDetailsTMDB(personId);
    if (!personDetail) {
      res.status(404).json({ error: 'Not Found', message: 'Person not found.' });
      return;
    }

    // 2. Cache person in database
    try {
      await db.query(
        `INSERT INTO people (person_id, name, profile_path)
         VALUES ($1, $2, $3)
         ON CONFLICT (person_id) DO UPDATE SET
           name = EXCLUDED.name,
           profile_path = COALESCE(EXCLUDED.profile_path, people.profile_path)`,
        [personDetail.person_id, personDetail.name, personDetail.profile_path || null]
      );
    } catch {
      // Ignore conflict
    }

    // 3. Cross-reference with authenticated user's watched diary logs
    let watchedMap = new Map<number, { rating: number | null }>();
    if (req.user) {
      const userLogs = await db.query(
        `SELECT tmdb_id, rating FROM diary_entries WHERE user_id = $1`,
        [req.user.id]
      );
      for (const row of userLogs.rows) {
        watchedMap.set(row.tmdb_id, { rating: row.rating ? parseFloat(row.rating) : null });
      }
    }

    let watchedCount = 0;
    const allUniqueMovieIds = new Set<number>();

    // Mark cast credits
    const mappedCast = personDetail.cast_credits.map((c) => {
      allUniqueMovieIds.add(c.tmdb_id);
      const userWatched = watchedMap.has(c.tmdb_id);
      return {
        ...c,
        watched: userWatched,
        user_rating: userWatched ? watchedMap.get(c.tmdb_id)?.rating : undefined
      };
    });

    // Mark crew credits
    const mappedCrew = personDetail.crew_credits.map((c) => {
      allUniqueMovieIds.add(c.tmdb_id);
      const userWatched = watchedMap.has(c.tmdb_id);
      return {
        ...c,
        watched: userWatched,
        user_rating: userWatched ? watchedMap.get(c.tmdb_id)?.rating : undefined
      };
    });

    for (const movieId of allUniqueMovieIds) {
      if (watchedMap.has(movieId)) {
        watchedCount++;
      }
    }

    const totalUniqueFilms = allUniqueMovieIds.size;
    const percentWatched =
      totalUniqueFilms > 0 ? Math.round((watchedCount / totalUniqueFilms) * 100) : 0;

    res.json({
      person: {
        id: personDetail.person_id,
        name: personDetail.name,
        biography: personDetail.biography,
        profile_path: personDetail.profile_path,
        birthday: personDetail.birthday,
        place_of_birth: personDetail.place_of_birth,
        known_for_department: personDetail.known_for_department
      },
      cast_credits: mappedCast,
      crew_credits: mappedCrew,
      stats: {
        total_films: totalUniqueFilms,
        watched_films: watchedCount,
        percent_watched: percentWatched
      }
    });
  } catch (err: any) {
    console.error('Person details error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch person details.' });
  }
});

export default router;
