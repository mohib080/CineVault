import { Router, Response } from 'express';
import { db } from '../config/db';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { enforceResourceAccess } from '../middleware/accessControl';
import { generateShareToken } from '../utils/crypto';
import { cacheMovie } from './movies';

const router = Router();

// Fetch current user's lists & watchlist
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { is_watchlist } = req.query;

    let query = `
      SELECT l.*, COUNT(li.tmdb_id) as item_count
      FROM movie_lists l
      LEFT JOIN list_items li ON l.id = li.list_id
      WHERE l.user_id = $1
    `;
    const params: any[] = [userId];

    if (is_watchlist !== undefined) {
      params.push(is_watchlist === 'true' ? 1 : 0);
      query += ` AND l.is_watchlist = $2`;
    }

    query += ` GROUP BY l.id ORDER BY l.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ lists: result.rows });
  } catch (err: any) {
    console.error('Error fetching lists:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch movie lists.' });
  }
});

// Create a new list or watchlist
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, description, is_watchlist, visibility } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Validation Error', message: 'List title is required.' });
      return;
    }

    let listVisibility = visibility;
    if (!['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(listVisibility)) {
      const userRes = await db.query('SELECT default_privacy FROM users WHERE id = $1', [userId]);
      listVisibility = userRes.rows[0]?.default_privacy || 'PRIVATE';
    }

    const shareToken = listVisibility === 'UNLISTED' ? generateShareToken() : null;

    const result = await db.query(
      `INSERT INTO movie_lists (user_id, title, description, is_watchlist, visibility, share_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title.trim(), description || null, is_watchlist ? 1 : 0, listVisibility, shareToken]
    );

    res.status(201).json({
      message: 'List created successfully',
      list: result.rows[0]
    });
  } catch (err: any) {
    console.error('Error creating list:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to create list.' });
  }
});

// Fetch a single list and its items (protected by verifyResourceAccess)
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const listId = parseInt(req.params.id, 10);
    if (isNaN(listId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid list ID.' });
      return;
    }

    const listRes = await db.query(
      `SELECT l.*, u.username
       FROM movie_lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1`,
      [listId]
    );

    if (listRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'List not found.' });
      return;
    }

    const list = listRes.rows[0];

    // Enforce privacy access control
    const allowed = enforceResourceAccess(list, req, res, 'Movie List');
    if (!allowed) return;

    // Fetch movies in the list
    const itemsRes = await db.query(
      `SELECT li.rank_order, li.notes, li.added_at,
              m.tmdb_id, m.title, m.release_year, m.poster_path, m.backdrop_path, m.director, m.runtime, m.overview
       FROM list_items li
       JOIN movies m ON li.tmdb_id = m.tmdb_id
       WHERE li.list_id = $1
       ORDER BY li.rank_order ASC, li.added_at DESC`,
      [listId]
    );

    res.json({
      list,
      items: itemsRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching list details:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch list.' });
  }
});

// One-click toggle between PRIVATE, UNLISTED, and PUBLIC
router.patch('/:id/visibility', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const listId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { visibility } = req.body;

    if (!['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(visibility)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid visibility state. Must be PUBLIC, UNLISTED, or PRIVATE.'
      });
      return;
    }

    const listCheck = await db.query('SELECT * FROM movie_lists WHERE id = $1', [listId]);
    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'List not found.' });
      return;
    }

    const list = listCheck.rows[0];
    if (list.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this list.' });
      return;
    }

    let shareToken = list.share_token;
    if (visibility === 'UNLISTED' && !shareToken) {
      shareToken = generateShareToken();
    }

    const updated = await db.query(
      `UPDATE movie_lists
       SET visibility = $1, share_token = $2
       WHERE id = $3
       RETURNING *`,
      [visibility, shareToken, listId]
    );

    res.json({
      message: `List visibility changed to ${visibility}`,
      list: updated.rows[0]
    });
  } catch (err: any) {
    console.error('Error updating list visibility:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update visibility.' });
  }
});

// Add movie to list
router.post('/:id/items', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const listId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { tmdb_id, title, release_year, poster_path, backdrop_path, director, runtime, notes, rank_order } = req.body;

    if (!tmdb_id) {
      res.status(400).json({ error: 'Validation Error', message: 'tmdb_id is required.' });
      return;
    }

    const listCheck = await db.query('SELECT user_id FROM movie_lists WHERE id = $1', [listId]);
    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'List not found.' });
      return;
    }

    if (listCheck.rows[0].user_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this list.' });
      return;
    }

    await cacheMovie({
      tmdb_id,
      title: title || 'Untitled Movie',
      release_year,
      poster_path,
      backdrop_path,
      director,
      runtime
    });

    await db.query(
      `INSERT INTO list_items (list_id, tmdb_id, rank_order, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (list_id, tmdb_id) DO UPDATE SET
         rank_order = COALESCE(EXCLUDED.rank_order, list_items.rank_order),
         notes = COALESCE(EXCLUDED.notes, list_items.notes)`,
      [listId, tmdb_id, rank_order || 0, notes || null]
    );

    res.status(201).json({ message: 'Movie added to list.' });
  } catch (err: any) {
    console.error('Error adding item to list:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to add movie to list.' });
  }
});

// Remove movie from list
router.delete('/:id/items/:tmdb_id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const listId = parseInt(req.params.id, 10);
    const tmdbId = parseInt(req.params.tmdb_id, 10);
    const userId = req.user!.id;

    const listCheck = await db.query('SELECT user_id FROM movie_lists WHERE id = $1', [listId]);
    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'List not found.' });
      return;
    }

    if (listCheck.rows[0].user_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this list.' });
      return;
    }

    await db.query('DELETE FROM list_items WHERE list_id = $1 AND tmdb_id = $2', [listId, tmdbId]);
    res.json({ message: 'Movie removed from list.' });
  } catch (err: any) {
    console.error('Error removing item from list:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to remove movie from list.' });
  }
});

// Delete entire list
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const listId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const listCheck = await db.query('SELECT user_id FROM movie_lists WHERE id = $1', [listId]);
    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'List not found.' });
      return;
    }

    if (listCheck.rows[0].user_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this list.' });
      return;
    }

    await db.query('DELETE FROM movie_lists WHERE id = $1', [listId]);
    res.json({ message: 'List deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting list:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete list.' });
  }
});

export default router;
