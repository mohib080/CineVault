import { Router, Response } from 'express';
import { db } from '../config/db';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get Top 4 Favorite Films for a user
router.get('/:username/favorites', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;
    const userRes = await db.query(
      'SELECT id, username FROM users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    const userId = userRes.rows[0].id;
    const favsRes = await db.query(
      `SELECT uf.slot, m.tmdb_id, m.title, m.release_year, m.poster_path, m.backdrop_path, m.director, m.rating
       FROM user_favorites uf
       JOIN movies m ON uf.tmdb_id = m.tmdb_id
       WHERE uf.user_id = $1
       ORDER BY uf.slot ASC`,
      [userId]
    );

    res.json({ favorites: favsRes.rows });
  } catch (err: any) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch favorites.' });
  }
});

// Update Top 4 Favorite Films for the authenticated user
router.put('/me/favorites', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { favorites } = req.body; // Array of { slot: 1|2|3|4, tmdb_id: number }

    if (!Array.isArray(favorites)) {
      res.status(400).json({ error: 'Validation Error', message: 'favorites must be an array.' });
      return;
    }

    // Delete existing favorites
    await db.query('DELETE FROM user_favorites WHERE user_id = $1', [userId]);

    for (const fav of favorites) {
      if (fav.slot >= 1 && fav.slot <= 4 && fav.tmdb_id) {
        await db.query(
          `INSERT INTO user_favorites (user_id, slot, tmdb_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, slot) DO UPDATE SET tmdb_id = EXCLUDED.tmdb_id`,
          [userId, fav.slot, fav.tmdb_id]
        );
      }
    }

    const updated = await db.query(
      `SELECT uf.slot, m.tmdb_id, m.title, m.release_year, m.poster_path, m.backdrop_path, m.director, m.rating
       FROM user_favorites uf
       JOIN movies m ON uf.tmdb_id = m.tmdb_id
       WHERE uf.user_id = $1
       ORDER BY uf.slot ASC`,
      [userId]
    );

    res.json({
      message: 'Favorites updated successfully.',
      favorites: updated.rows
    });
  } catch (err: any) {
    console.error('Error updating favorites:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update favorites.' });
  }
});

// Get user profile + diary logs + lists + favorites + detailed stats respecting privacy rules
router.get('/:username/profile', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const userRes = await db.query(
      'SELECT id, username, default_privacy, created_at FROM users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    const profileUser = userRes.rows[0];
    const isOwner = Boolean(req.user && req.user.id === profileUser.id);

    // Filter diary entries: If owner, return ALL. If guest/other user, return ONLY 'PUBLIC'.
    let diaryQuery = `
      SELECT d.*, m.title, m.release_year, m.poster_path, m.backdrop_path, m.director, m.runtime
      FROM diary_entries d
      JOIN movies m ON d.tmdb_id = m.tmdb_id
      WHERE d.user_id = $1
    `;
    const diaryParams: any[] = [profileUser.id];

    if (!isOwner) {
      diaryQuery += ` AND d.visibility = 'PUBLIC'`;
    }

    diaryQuery += ` ORDER BY d.watched_date DESC, d.created_at DESC`;
    const diaryRes = await db.query(diaryQuery, diaryParams);

    // Filter lists: If owner, return ALL. If guest/other user, return ONLY 'PUBLIC'.
    let listQuery = `
      SELECT l.*, COUNT(li.tmdb_id) as item_count
      FROM movie_lists l
      LEFT JOIN list_items li ON l.id = li.list_id
      WHERE l.user_id = $1
    `;
    const listParams: any[] = [profileUser.id];

    if (!isOwner) {
      listQuery += ` AND l.visibility = 'PUBLIC'`;
    }

    listQuery += ` GROUP BY l.id ORDER BY l.created_at DESC`;
    const listRes = await db.query(listQuery, listParams);

    // Fetch user favorites
    const favsRes = await db.query(
      `SELECT uf.slot, m.tmdb_id, m.title, m.release_year, m.poster_path, m.backdrop_path, m.director, m.rating
       FROM user_favorites uf
       JOIN movies m ON uf.tmdb_id = m.tmdb_id
       WHERE uf.user_id = $1
       ORDER BY uf.slot ASC`,
      [profileUser.id]
    );

    // Compute stats
    const totalFilms = diaryRes.rows.length;
    const ratings = diaryRes.rows.filter((r: any) => r.rating !== null).map((r: any) => Number(r.rating));
    const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : '0.0';
    const rewatchCount = diaryRes.rows.filter((r: any) => Boolean(r.is_rewatch)).length;

    // Calculate total hours watched
    const totalMinutes = diaryRes.rows.reduce((acc: number, r: any) => acc + (Number(r.runtime) || 105), 0);
    const totalHoursWatched = Math.round(totalMinutes / 60);

    // Calculate top directors
    const directorCounts: Record<string, number> = {};
    for (const r of diaryRes.rows) {
      if (r.director && r.director !== 'Unknown') {
        directorCounts[r.director] = (directorCounts[r.director] || 0) + 1;
      }
    }
    const topDirectors = Object.entries(directorCounts)
      .map(([director, count]) => ({ director, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate top genres
    const genreCounts: Record<string, number> = {};
    const movieIds = diaryRes.rows.map((r: any) => r.tmdb_id);
    if (movieIds.length > 0) {
      const placeholders = movieIds.map((_: any, idx: number) => `$${idx + 1}`).join(',');
      try {
        const genresRes = await db.query(
          `SELECT g.name, COUNT(mg.tmdb_id) as count
           FROM genres g
           JOIN movie_genres mg ON g.id = mg.genre_id
           WHERE mg.tmdb_id IN (${placeholders})
           GROUP BY g.name
           ORDER BY count DESC
           LIMIT 5`,
          movieIds
        );
        for (const g of genresRes.rows) {
          genreCounts[g.name] = parseInt(g.count, 10);
        }
      } catch {
        // fallback
      }
    }
    const topGenres = Object.entries(genreCounts).map(([name, count]) => ({ name, count }));

    // Rating distribution for chart: 0.5 to 5.0
    const ratingDistribution: Record<string, number> = {
      '0.5': 0, '1.0': 0, '1.5': 0, '2.0': 0, '2.5': 0,
      '3.0': 0, '3.5': 0, '4.0': 0, '4.5': 0, '5.0': 0
    };
    for (const r of ratings) {
      const key = r.toFixed(1);
      if (ratingDistribution[key] !== undefined) {
        ratingDistribution[key]++;
      }
    }

    res.json({
      user: {
        id: profileUser.id,
        username: profileUser.username,
        created_at: profileUser.created_at,
        isOwner
      },
      stats: {
        totalFilms,
        avgRating,
        rewatchCount,
        totalHoursWatched,
        topDirectors,
        topGenres,
        listsCount: listRes.rows.length,
        ratingDistribution
      },
      favorites: favsRes.rows,
      entries: diaryRes.rows,
      lists: listRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user profile.' });
  }
});

export default router;
