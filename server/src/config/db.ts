import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface IDatabase {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  isPostgres(): boolean;
}

let dbInstance: IDatabase | null = null;

// SQLite fallback storage
class SQLiteFallbackDatabase implements IDatabase {
  private db: Database.Database;

  constructor() {
    // Use D:\cinevault_data if available (saves C: drive space), else local
    const dbPath = process.env.SQLITE_PATH || (
      fs.existsSync('D:\\cinevault_data')
        ? 'D:\\cinevault_data\\cinevault.sqlite'
        : path.resolve(__dirname, '../../../cinevault_fallback.sqlite')
    );
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');
    this.initTables();
  }

  getRawDb(): Database.Database {
    return this.db;
  }

  isPostgres(): boolean {
    return false;
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        default_privacy TEXT DEFAULT 'PRIVATE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS movies (
        tmdb_id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        release_year INTEGER,
        title_type TEXT DEFAULT 'movie',
        poster_path TEXT,
        backdrop_path TEXT,
        director TEXT,
        runtime INTEGER,
        overview TEXT,
        imdb_id TEXT,
        rating NUMERIC,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
      CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(title_type);
      CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);

      CREATE TABLE IF NOT EXISTS diary_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id INTEGER NOT NULL REFERENCES movies(tmdb_id),
        rating NUMERIC,
        review_text TEXT,
        watched_date TEXT NOT NULL,
        is_rewatch INTEGER DEFAULT 0,
        contains_spoilers INTEGER DEFAULT 0,
        visibility TEXT NOT NULL DEFAULT 'PRIVATE',
        share_token TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS movie_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        is_watchlist INTEGER DEFAULT 0,
        visibility TEXT NOT NULL DEFAULT 'PRIVATE',
        share_token TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS list_items (
        list_id INTEGER NOT NULL REFERENCES movie_lists(id) ON DELETE CASCADE,
        tmdb_id INTEGER NOT NULL REFERENCES movies(tmdb_id),
        rank_order INTEGER DEFAULT 0,
        notes TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (list_id, tmdb_id)
      );
    `);

    // Migration helper for existing sqlite tables
    try {
      this.db.exec("ALTER TABLE movies ADD COLUMN imdb_id TEXT;");
    } catch {}
    try {
      this.db.exec("ALTER TABLE movies ADD COLUMN title_type TEXT DEFAULT 'movie';");
    } catch {}
    try {
      this.db.exec("CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);");
      this.db.exec("CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(title_type);");
      this.db.exec("CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);");
    } catch {}
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    // Map PostgreSQL style $1, $2, etc. to SQLite style ? while preserving parameter mapping
    const mappedParams: any[] = [];
    let convertedSql = text.replace(/\$(\d+)/g, (_, n) => {
      const idx = parseInt(n, 10) - 1;
      mappedParams.push(params[idx]);
      return '?';
    });

    // Handle PostgreSQL specific syntax variations:
    // e.g. NOW() -> CURRENT_TIMESTAMP, CURRENT_DATE -> date('now')
    convertedSql = convertedSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    convertedSql = convertedSql.replace(/CURRENT_DATE/gi, "date('now')");

    // Check for RETURNING clause
    const returningMatch = convertedSql.match(/RETURNING\s+(.*)$/i);
    const hasReturning = Boolean(returningMatch);
    const sqlWithoutReturning = convertedSql.replace(/RETURNING\s+.*$/i, '').trim();

    const trimmed = sqlWithoutReturning.trim().toUpperCase();

    try {
      if (trimmed.startsWith('SELECT')) {
        const stmt = this.db.prepare(convertedSql);
        const rows = stmt.all(...mappedParams) as T[];
        return { rows, rowCount: rows.length };
      }

      if (trimmed.startsWith('INSERT')) {
        const stmt = this.db.prepare(sqlWithoutReturning);
        const info = stmt.run(...mappedParams);
        if (hasReturning) {
          // If query inserted into a table, fetch the inserted row by lastInsertRowid
          const fromTableMatch = sqlWithoutReturning.match(/INTO\s+([a-zA-Z0-9_]+)/i);
          if (fromTableMatch) {
            const table = fromTableMatch[1];
            const selectStmt = this.db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`);
            const inserted = selectStmt.get(info.lastInsertRowid) as T;
            return { rows: inserted ? [inserted] : [], rowCount: info.changes };
          }
        }
        return { rows: [], rowCount: info.changes };
      }

      if (trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE')) {
        let rowsBefore: any[] = [];
        if (hasReturning) {
          // Find target table and primary condition to capture returning rows
          const tableMatch = trimmed.startsWith('UPDATE')
            ? sqlWithoutReturning.match(/UPDATE\s+([a-zA-Z0-9_]+)/i)
            : sqlWithoutReturning.match(/FROM\s+([a-zA-Z0-9_]+)/i);

          const whereIndex = sqlWithoutReturning.toUpperCase().indexOf('WHERE');
          if (tableMatch && whereIndex !== -1) {
            const table = tableMatch[1];
            const whereClause = sqlWithoutReturning.substring(whereIndex);
            try {
              // Extract params that correspond to WHERE clause if possible
              const preSelect = this.db.prepare(`SELECT * FROM ${table} ${whereClause}`);
              const whereParamCount = (whereClause.match(/\?/g) || []).length;
              const whereParams = mappedParams.slice(mappedParams.length - whereParamCount);
              rowsBefore = preSelect.all(...whereParams);
            } catch {
              // ignore pre-select error
            }
          }
        }

        const stmt = this.db.prepare(sqlWithoutReturning);
        const info = stmt.run(...mappedParams);

        if (hasReturning && rowsBefore.length > 0) {
          // Refetch updated row(s)
          const tableMatch = sqlWithoutReturning.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
          if (tableMatch && rowsBefore[0].id !== undefined) {
            const ids = rowsBefore.map((r: any) => r.id);
            const placeholders = ids.map(() => '?').join(',');
            const refetch = this.db.prepare(`SELECT * FROM ${tableMatch[1]} WHERE id IN (${placeholders})`);
            const updatedRows = refetch.all(...ids) as T[];
            return { rows: updatedRows, rowCount: info.changes };
          }
        }
        return { rows: [], rowCount: info.changes };
      }

      // Default statement execution
      const stmt = this.db.prepare(convertedSql);
      const rows = stmt.all ? (stmt.all(...mappedParams) as T[]) : [];
      return { rows, rowCount: rows.length };
    } catch (err) {
      console.error('SQLite execution error on query:', convertedSql, mappedParams, err);
      throw err;
    }
  }
}

class PostgresDatabase implements IDatabase {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  isPostgres(): boolean {
    return true;
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const res = await this.pool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount || 0
    };
  }
}

export async function getDb(): Promise<IDatabase> {
  if (dbInstance) return dbInstance;

  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cinevault_db';

  try {
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 1500
    });

    // Test PostgreSQL connectivity
    const client = await pool.connect();
    console.log('Connected successfully to PostgreSQL database.');

    // Execute schema.sql to ensure tables exist
    try {
      const schemaPath = path.resolve(__dirname, '../db/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('PostgreSQL schema initialized successfully.');
      }
    } catch (schemaErr) {
      console.warn('PostgreSQL schema setup note:', schemaErr);
    } finally {
      client.release();
    }

    dbInstance = new PostgresDatabase(pool);
    return dbInstance;
  } catch (err: any) {
    console.warn(`PostgreSQL unavailable (${err.message}). Activating CineVault zero-config local engine.`);
    dbInstance = new SQLiteFallbackDatabase();
    return dbInstance;
  }
}

export const db = {
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const instance = await getDb();
    return instance.query<T>(text, params);
  }
};
