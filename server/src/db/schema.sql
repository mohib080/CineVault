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

-- 2. Movies & Series Table (TMDB metadata cache & IMDb ingestion)
CREATE TABLE IF NOT EXISTS movies (
    tmdb_id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_year INT,
    title_type VARCHAR(32) DEFAULT 'movie',
    poster_path TEXT,
    backdrop_path TEXT,
    director VARCHAR(255),
    runtime INT,
    overview TEXT,
    tagline TEXT,
    vote_average NUMERIC(3,1),
    trailer_key VARCHAR(64),
    imdb_id VARCHAR(32),
    rating NUMERIC(3,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(title_type);
CREATE INDEX IF NOT EXISTS idx_movies_vote ON movies(vote_average);

-- 3. Genres Table
CREATE TABLE IF NOT EXISTS genres (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 4. Movie Genres Junction Table
CREATE TABLE IF NOT EXISTS movie_genres (
    tmdb_id INT REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (tmdb_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_genres_genre ON movie_genres(genre_id);

-- 5. People Table (Cast & Crew)
CREATE TABLE IF NOT EXISTS people (
    person_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profile_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);

-- 6. Movie Credits Junction Table (Cast & Crew per Movie)
CREATE TABLE IF NOT EXISTS movie_credits (
    tmdb_id INT REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    person_id INT REFERENCES people(person_id) ON DELETE CASCADE,
    credit_type VARCHAR(20), -- 'cast' or 'crew'
    character_name VARCHAR(255),
    job VARCHAR(100),
    billing_order INT,
    PRIMARY KEY (tmdb_id, person_id, credit_type, job)
);

CREATE INDEX IF NOT EXISTS idx_credits_movie ON movie_credits(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_credits_person ON movie_credits(person_id);

-- 7. Diary Entries (Reviews & Watch Logs)
CREATE TABLE IF NOT EXISTS diary_entries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INT NOT NULL REFERENCES movies(tmdb_id),
    rating NUMERIC(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
    review_text TEXT,
    watched_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_rewatch BOOLEAN DEFAULT FALSE,
    contains_spoilers BOOLEAN DEFAULT FALSE,
    liked BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    visibility visibility_type NOT NULL DEFAULT 'PRIVATE',
    share_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Movie Lists (Watchlist & Custom Curated Lists)
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

-- 9. List Items (Movies in custom lists/watchlists)
CREATE TABLE IF NOT EXISTS list_items (
    list_id INT NOT NULL REFERENCES movie_lists(id) ON DELETE CASCADE,
    tmdb_id INT NOT NULL REFERENCES movies(tmdb_id),
    rank_order INT DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (list_id, tmdb_id)
);

-- 10. User Top 4 Favorites (Letterboxd-style showcase)
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INT REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    slot INT CHECK (slot BETWEEN 1 AND 4),
    PRIMARY KEY (user_id, slot)
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_visibility ON diary_entries(visibility);
CREATE INDEX IF NOT EXISTS idx_diary_share_token ON diary_entries(share_token);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON movie_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_share_token ON movie_lists(share_token);
CREATE INDEX IF NOT EXISTS idx_user_favorites ON user_favorites(user_id);
