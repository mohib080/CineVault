import { Router, Response } from 'express';
import { db } from '../config/db';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get user profile + diary logs + lists respecting privacy rules
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

    // Compute stats
    const totalFilms = diaryRes.rows.length;
    const ratings = diaryRes.rows.filter((r: any) => r.rating !== null).map((r: any) => Number(r.rating));
    const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : '0.0';
    const rewatchCount = diaryRes.rows.filter((r: any) => Boolean(r.is_rewatch)).length;

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
        listsCount: listRes.rows.length,
        ratingDistribution
      },
      entries: diaryRes.rows,
      lists: listRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user profile.' });
  }
});

export default router;
