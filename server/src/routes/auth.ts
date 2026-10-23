import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { signToken, requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, default_privacy } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Validation Error', message: 'Username, email, and password are required.' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Validation Error', message: 'Username must be at least 3 characters.' });
      return;
    }

    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [username.trim(), email.trim()]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Conflict', message: 'Username or email is already registered.' });
      return;
    }

    const privacy = ['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(default_privacy)
      ? default_privacy
      : 'PRIVATE';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, default_privacy)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, default_privacy, created_at`,
      [username.trim(), email.trim(), passwordHash, privacy]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, username: user.username, email: user.email });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        default_privacy: user.default_privacy,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to register user.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { login, password } = req.body; // login can be username or email

    if (!login || !password) {
      res.status(400).json({ error: 'Validation Error', message: 'Username/email and password are required.' });
      return;
    }

    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [login.trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
      return;
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        default_privacy: user.default_privacy,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to log in.' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      'SELECT id, username, email, default_privacy, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (err: any) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user.' });
  }
});

export default router;
