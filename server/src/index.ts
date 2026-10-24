import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import moviesRoutes from './routes/movies';
import diaryRoutes from './routes/diary';
import listsRoutes from './routes/lists';
import usersRoutes from './routes/users';
import peopleRoutes from './routes/people';
import { getDb } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes (mounted with and without /api for universal serverless compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/movies', moviesRoutes);
app.use('/movies', moviesRoutes);

app.use('/api/diary', diaryRoutes);
app.use('/diary', diaryRoutes);

app.use('/api/lists', listsRoutes);
app.use('/lists', listsRoutes);

app.use('/api/users', usersRoutes);
app.use('/users', usersRoutes);

app.use('/api/people', peopleRoutes);
app.use('/people', peopleRoutes);

// Health check endpoint
app.get(['/api/health', '/health'], async (_req, res) => {
  const db = await getDb();
  res.json({
    status: 'ok',
    name: 'CineVault API',
    database: db.isPostgres() ? 'PostgreSQL' : 'Embedded Engine (Zero-Config Active)',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if present
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('CineVault API is active. Frontend build will be served here.');
    }
  });
});

// Start server only when executed directly (not when imported in tests)
if (require.main === module && process.env.NODE_ENV !== 'test') {
  getDb().then(() => {
    const port = Number(PORT) || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🎬 CineVault Server running on http://0.0.0.0:${port}`);
    });
  }).catch((err) => {
    console.error('Failed to initialize database on startup:', err);
  });
}

export default app;
