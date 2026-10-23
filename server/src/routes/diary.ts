import { Router, Response } from 'express';
import { db } from '../config/db';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { enforceResourceAccess } from '../middleware/accessControl';
import { generateShareToken } from '../utils/crypto';
import { cacheMovie } from './movies';

const router = Router();

// Log a movie in CineVault
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      tmdb_id,
      title,
      release_year,
      poster_path,
      backdrop_path,
      director,
      runtime,
      overview,
      rating,
      review_text,
      watched_date,
      is_rewatch,
      contains_spoilers,
      visibility
    } = req.body;

    if (!tmdb_id) {
      res.status(400).json({ error: 'Validation Error', message: 'tmdb_id is required.' });
      return;
    }

    // Ensure movie is cached in movies table
    await cacheMovie({
      tmdb_id,
      title: title || 'Untitled Movie',
      release_year,
      poster_path,
      backdrop_path,
      director,
      runtime,
      overview
    });

    // Rating validation (half star support: 0.5 to 5.0 in 0.5 steps)
    let parsedRating: number | null = null;
    if (rating !== undefined && rating !== null && rating !== '') {
      parsedRating = parseFloat(rating);
      if (isNaN(parsedRating) || parsedRating < 0.5 || parsedRating > 5.0) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Rating must be between 0.5 and 5.0.'
        });
        return;
      }
    }

    // Determine visibility: fallback to user default if not specified
    let entryVisibility = visibility;
    if (!['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(entryVisibility)) {
      const userRes = await db.query('SELECT default_privacy FROM users WHERE id = $1', [userId]);
      entryVisibility = userRes.rows[0]?.default_privacy || 'PRIVATE';
    }

    // Auto-generate share_token if UNLISTED
    const shareToken = entryVisibility === 'UNLISTED' ? generateShareToken() : null;

    const entryWatchedDate = watched_date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `INSERT INTO diary_entries (
        user_id, tmdb_id, rating, review_text, watched_date, is_rewatch, contains_spoilers, visibility, share_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        tmdb_id,
        parsedRating,
        review_text || null,
        entryWatchedDate,
        is_rewatch ? 1 : 0,
        contains_spoilers ? 1 : 0,
        entryVisibility,
        shareToken
      ]
    );

    const created = result.rows[0];

    // Fetch movie details for response
    const movieRes = await db.query('SELECT * FROM movies WHERE tmdb_id = $1', [tmdb_id]);

    res.status(201).json({
      message: 'Movie logged successfully to vault',
      entry: {
        ...created,
        movie: movieRes.rows[0]
      }
    });
  } catch (err: any) {
    console.error('Error logging movie:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to log movie to diary.' });
  }
});

// Fetch user's own diary entries (with optional privacy filter)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { visibility } = req.query;

    let query = `
      SELECT d.*, m.title, m.release_year, m.poster_path, m.backdrop_path, m.director, m.runtime
      FROM diary_entries d
      JOIN movies m ON d.tmdb_id = m.tmdb_id
      WHERE d.user_id = $1
    `;
    const params: any[] = [userId];

    if (visibility && ['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(visibility as string)) {
      params.push(visibility);
      query += ` AND d.visibility = $2`;
    }

    query += ` ORDER BY d.watched_date DESC, d.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ entries: result.rows });
  } catch (err: any) {
    console.error('Error fetching diary entries:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch diary entries.' });
  }
});

// Fetch single review (protected by verifyResourceAccess)
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id, 10);
    if (isNaN(entryId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid entry ID.' });
      return;
    }

    const result = await db.query(
      `SELECT d.*, m.title, m.release_year, m.poster_path, m.backdrop_path, m.director, m.runtime, m.overview,
              u.username
       FROM diary_entries d
       JOIN movies m ON d.tmdb_id = m.tmdb_id
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [entryId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Diary entry not found.' });
      return;
    }

    const entry = result.rows[0];

    // Enforce access control
    const allowed = enforceResourceAccess(entry, req, res, 'Diary Entry');
    if (!allowed) return;

    res.json({ entry });
  } catch (err: any) {
    console.error('Error fetching entry:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch diary entry.' });
  }
});

// One-click toggle between PRIVATE, UNLISTED, and PUBLIC
router.patch('/:id/visibility', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { visibility } = req.body;

    if (!['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(visibility)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid visibility state. Must be PUBLIC, UNLISTED, or PRIVATE.'
      });
      return;
    }

    // Verify ownership
    const entryCheck = await db.query('SELECT * FROM diary_entries WHERE id = $1', [entryId]);
    if (entryCheck.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Diary entry not found.' });
      return;
    }

    const entry = entryCheck.rows[0];
    if (entry.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this diary entry.' });
      return;
    }

    // If changing to UNLISTED and share_token doesn't exist, create one
    let shareToken = entry.share_token;
    if (visibility === 'UNLISTED' && !shareToken) {
      shareToken = generateShareToken();
    }

    const updated = await db.query(
      `UPDATE diary_entries
       SET visibility = $1, share_token = $2
       WHERE id = $3
       RETURNING *`,
      [visibility, shareToken, entryId]
    );

    res.json({
      message: `Visibility changed to ${visibility}`,
      entry: updated.rows[0]
    });
  } catch (err: any) {
    console.error('Error updating entry visibility:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update visibility.' });
  }
});

// Update diary entry
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { rating, review_text, watched_date, is_rewatch, contains_spoilers, visibility } = req.body;

    const entryCheck = await db.query('SELECT * FROM diary_entries WHERE id = $1', [entryId]);
    if (entryCheck.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Diary entry not found.' });
      return;
    }

    const entry = entryCheck.rows[0];
    if (entry.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this diary entry.' });
      return;
    }

    let shareToken = entry.share_token;
    const targetVisibility = visibility || entry.visibility;
    if (targetVisibility === 'UNLISTED' && !shareToken) {
      shareToken = generateShareToken();
    }

    let parsedRating = entry.rating;
    if (rating !== undefined) {
      parsedRating = rating === null || rating === '' ? null : parseFloat(rating);
    }

    const updated = await db.query(
      `UPDATE diary_entries
       SET rating = $1, review_text = $2, watched_date = $3, is_rewatch = $4,
           contains_spoilers = $5, visibility = $6, share_token = $7
       WHERE id = $8
       RETURNING *`,
      [
        parsedRating,
        review_text !== undefined ? review_text : entry.review_text,
        watched_date || entry.watched_date,
        is_rewatch !== undefined ? (is_rewatch ? 1 : 0) : entry.is_rewatch,
        contains_spoilers !== undefined ? (contains_spoilers ? 1 : 0) : entry.contains_spoilers,
        targetVisibility,
        shareToken,
        entryId
      ]
    );

    res.json({
      message: 'Diary entry updated successfully',
      entry: updated.rows[0]
    });
  } catch (err: any) {
    console.error('Error updating diary entry:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update diary entry.' });
  }
});

// Delete diary entry
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const entryCheck = await db.query('SELECT user_id FROM diary_entries WHERE id = $1', [entryId]);
    if (entryCheck.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Diary entry not found.' });
      return;
    }

    if (entryCheck.rows[0].user_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not own this diary entry.' });
      return;
    }

    await db.query('DELETE FROM diary_entries WHERE id = $1', [entryId]);
    res.json({ message: 'Diary entry deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting diary entry:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete diary entry.' });
  }
});

export default router;
