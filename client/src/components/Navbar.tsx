import React, { useState } from 'react';
import { Shield, Film, Search, Bookmark, User as UserIcon, LogOut, Plus, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Movie } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onSearchMovie: (query: string) => void;
  onQuickLog?: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onSearchMovie,
  onQuickLog,
  onOpenAuth
}) => {
  const { user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchMovie(searchInput.trim());
      onSelectTab('explore');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('home');
          }}
          className="nav-brand"
        >
          <div className="vault-badge-icon">
            <Shield size={18} strokeWidth={2.8} />
          </div>
          <span>
            Cine<span style={{ color: 'var(--accent-cyan)' }}>Vault</span>
          </span>
        </a>

        {/* Global Movie Search Bar */}
        <form onSubmit={handleSearchSubmit} className="nav-search">
          <Search size={16} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search films, directors, or vault logs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        {/* Navigation Items */}
        <div className="nav-links">
          <button
            onClick={() => onSelectTab('home')}
            className={`nav-item ${currentTab === 'home' ? 'active' : ''}`}
          >
            <Film size={16} /> Explore
          </button>

          {user && (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              >
                <Lock size={16} /> My Vault
              </button>

              <button
                onClick={() => onSelectTab('lists')}
                className={`nav-item ${currentTab === 'lists' ? 'active' : ''}`}
              >
                <Bookmark size={16} /> Lists
              </button>
            </>
          )}

          {/* Quick Log Button */}
          {user && onQuickLog && (
            <button
              onClick={onQuickLog}
              className="btn btn-gold"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              <Plus size={15} /> Log Film
            </button>
          )}

          {/* User Section */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <button
                onClick={() => onSelectTab('profile')}
                className="nav-item"
                style={{ fontWeight: 700, color: 'var(--text-main)' }}
                title="View your public profile"
              >
                <UserIcon size={16} color="var(--accent-cyan)" />
                <span>{user.username}</span>
              </button>
              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.65rem' }}
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                Create Vault
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
