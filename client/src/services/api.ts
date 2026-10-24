const API_BASE = '/api';

export interface User {
  id: number;
  username: string;
  email: string;
  default_privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  created_at?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  person_id: number;
  name: string;
  profile_path?: string;
  character_name?: string;
  billing_order?: number;
}

export interface CrewMember {
  person_id: number;
  name: string;
  profile_path?: string;
  job: string;
}

export interface Movie {
  tmdb_id: number;
  title: string;
  release_year?: number;
  title_type?: string;
  poster_path?: string;
  backdrop_path?: string;
  director?: string;
  runtime?: number;
  overview?: string;
  tagline?: string;
  vote_average?: number;
  rating?: number;
  trailer_key?: string;
  imdb_id?: string;
  genres?: Genre[];
  cast?: CastMember[];
  crew?: CrewMember[];
  similar?: Movie[];
}

export interface DiaryEntry {
  id: number;
  user_id: number;
  tmdb_id: number;
  rating: number | null;
  review_text: string | null;
  watched_date: string;
  is_rewatch: boolean | number;
  contains_spoilers: boolean | number;
  liked?: boolean | number;
  tags?: string;
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  share_token: string | null;
  created_at: string;
  title?: string;
  release_year?: number;
  poster_path?: string;
  backdrop_path?: string;
  director?: string;
  runtime?: number;
  overview?: string;
  username?: string;
}

export interface MovieList {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_watchlist: boolean | number;
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  share_token: string | null;
  created_at: string;
  item_count?: number;
  username?: string;
}

export interface FavoriteMovie {
  slot: number;
  tmdb_id: number;
  title: string;
  release_year?: number;
  poster_path?: string;
  backdrop_path?: string;
  director?: string;
  rating?: number;
}

export interface PersonCredit {
  tmdb_id: number;
  title: string;
  release_year?: number;
  poster_path?: string;
  character_name?: string;
  job?: string;
  credit_type: 'cast' | 'crew';
  rating?: number;
  watched?: boolean;
  user_rating?: number;
}

export interface PersonDetail {
  person: {
    id: number;
    name: string;
    biography?: string;
    profile_path?: string;
    birthday?: string;
    place_of_birth?: string;
    known_for_department?: string;
  };
  cast_credits: PersonCredit[];
  crew_credits: PersonCredit[];
  stats: {
    total_films: number;
    watched_films: number;
    percent_watched: number;
  };
}

export interface DiscoverResponse {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('cinevault_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('cinevault_token', token);
  } else {
    localStorage.removeItem('cinevault_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { username: string; email: string; password: string; default_privacy?: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (payload: { login: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getMe: () => request<{ user: User }>('/auth/me'),

  // Movies & Discovery
  discoverMovies: (category: string = 'trending', page: number = 1, genre?: number, year?: number) => {
    const params = new URLSearchParams({ category, page: page.toString() });
    if (genre) params.append('genre', genre.toString());
    if (year) params.append('year', year.toString());
    return request<DiscoverResponse>(`/movies/discover?${params.toString()}`);
  },
  getGenres: () => request<{ genres: Genre[] }>('/movies/genres'),
  searchMovies: (query: string) => request<{ results: Movie[] }>(`/movies/search?q=${encodeURIComponent(query)}`),
  getPopularMovies: () => request<{ results: Movie[] }>('/movies/popular'),
  getMovieDetail: (id: number) => request<{ movie: Movie; userLogs: DiaryEntry[]; communityLogs: DiaryEntry[] }>(`/movies/${id}`),

  // People (Cast & Crew filmographies)
  getPersonDetail: (personId: number) => request<PersonDetail>(`/people/${personId}`),

  // Top 4 Favorites
  getUserFavorites: (username: string) => request<{ favorites: FavoriteMovie[] }>(`/users/${encodeURIComponent(username)}/favorites`),
  updateUserFavorites: (favorites: Array<{ slot: number; tmdb_id: number }>) =>
    request<{ message: string; favorites: FavoriteMovie[] }>('/users/me/favorites', {
      method: 'PUT',
      body: JSON.stringify({ favorites })
    }),

  // Diary Logs
  logMovie: (payload: Partial<DiaryEntry> & { tmdb_id: number }) =>
    request<{ message: string; entry: DiaryEntry }>('/diary', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  importLetterboxdCsv: (
    csvText: string,
    default_visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' = 'PRIVATE',
    type: 'diary' | 'watchlist' = 'diary'
  ) =>
    request<{ message: string; imported: number; skipped: number; total: number; errors: string[] }>('/diary/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvText, default_visibility, type })
    }),
  getMyDiary: (visibility?: string) =>
    request<{ entries: DiaryEntry[] }>(`/diary${visibility && visibility !== 'ALL' ? `?visibility=${visibility}` : ''}`),
  getDiaryEntry: (id: number, token?: string) =>
    request<{ entry: DiaryEntry }>(`/diary/${id}${token ? `?token=${encodeURIComponent(token)}` : ''}`),
  updateDiaryVisibility: (id: number, visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE') =>
    request<{ message: string; entry: DiaryEntry }>(`/diary/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility })
    }),
  updateDiaryEntry: (id: number, payload: Partial<DiaryEntry>) =>
    request<{ message: string; entry: DiaryEntry }>(`/diary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteDiaryEntry: (id: number) =>
    request<{ message: string }>(`/diary/${id}`, {
      method: 'DELETE'
    }),

  // Lists
  getLists: (isWatchlist?: boolean) =>
    request<{ lists: MovieList[] }>(`/lists${isWatchlist !== undefined ? `?is_watchlist=${isWatchlist}` : ''}`),
  createList: (payload: { title: string; description?: string; is_watchlist?: boolean; visibility?: string }) =>
    request<{ message: string; list: MovieList }>('/lists', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getList: (id: number, token?: string) =>
    request<{ list: MovieList; items: (Movie & { rank_order: number; notes: string })[] }>(
      `/lists/${id}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    ),
  updateListVisibility: (id: number, visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE') =>
    request<{ message: string; list: MovieList }>(`/lists/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility })
    }),
  addMovieToList: (listId: number, movie: Movie & { notes?: string }) =>
    request<{ message: string }>(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(movie)
    }),
  removeMovieFromList: (listId: number, tmdbId: number) =>
    request<{ message: string }>(`/lists/${listId}/items/${tmdbId}`, {
      method: 'DELETE'
    }),
  deleteList: (id: number) =>
    request<{ message: string }>(`/lists/${id}`, {
      method: 'DELETE'
    }),

  // User Profile
  getUserProfile: (username: string) =>
    request<{
      user: { id: number; username: string; created_at: string; isOwner: boolean };
      stats: {
        totalFilms: number;
        avgRating: string;
        rewatchCount: number;
        totalHoursWatched: number;
        topDirectors: Array<{ director: string; count: number }>;
        topGenres: Array<{ name: string; count: number }>;
        listsCount: number;
        ratingDistribution: Record<string, number>;
      };
      favorites: FavoriteMovie[];
      entries: DiaryEntry[];
      lists: MovieList[];
    }>(`/users/${encodeURIComponent(username)}/profile`)
};
