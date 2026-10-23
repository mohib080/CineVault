-- CineVault PostgreSQL Database Schema
-- Supports Granular Privacy Controls ('PUBLIC', 'UNLISTED', 'PRIVATE')

DO $$ BEGIN
    CREATE TYPE visibility_type AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    default_privacy visibility_type DEFAULT 'PRIVATE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Movies Table (Local TMDB metadata cache)
CREATE TABLE IF NOT EXISTS movies (
    tmdb_id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_year INT,
    poster_path TEXT,
    backdrop_path TEXT,
    director VARCHAR(255),
    runtime INT,
    overview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Diary Entries (Reviews & Watch Logs)
CREATE TABLE IF NOT EXISTS diary_entries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INT NOT NULL REFERENCES movies(tmdb_id),
    rating NUMERIC(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
    review_text TEXT,
    watched_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_rewatch BOOLEAN DEFAULT FALSE,
    contains_spoilers BOOLEAN DEFAULT FALSE,
    visibility visibility_type NOT NULL DEFAULT 'PRIVATE',
    share_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Movie Lists (Watchlist & Custom Curated Lists)
CREATE TABLE IF NOT EXISTS movie_lists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_watchlist BOOLEAN DEFAULT FALSE,
    visibility visibility_type NOT NULL DEFAULT 'PRIVATE',
    share_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. List Items (Movies in custom lists/watchlists)
CREATE TABLE IF NOT EXISTS list_items (
    list_id INT NOT NULL REFERENCES movie_lists(id) ON DELETE CASCADE,
    tmdb_id INT NOT NULL REFERENCES movies(tmdb_id),
    rank_order INT DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (list_id, tmdb_id)
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_visibility ON diary_entries(visibility);
CREATE INDEX IF NOT EXISTS idx_diary_share_token ON diary_entries(share_token);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON movie_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_share_token ON movie_lists(share_token);
