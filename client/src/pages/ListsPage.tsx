import React, { useState, useEffect } from 'react';
import { MovieList, Movie, api } from '../services/api';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { ShareModal } from '../components/ShareModal';
import { Plus, Bookmark, List, Share2, Trash2, X } from 'lucide-react';

export const ListsPage: React.FC = () => {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<MovieList | null>(null);
  const [listItems, setListItems] = useState<(Movie & { rank_order: number; notes: string })[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // New list modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsWatchlist, setNewIsWatchlist] = useState(false);
  const [newVisibility, setNewVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PRIVATE');

  // Share modal
  const [shareModalData, setShareModalData] = useState<{ id: number; token: string; title: string } | null>(null);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await api.getLists();
      setLists(res.lists);
      if (res.lists.length > 0 && !selectedList) {
        loadListDetails(res.lists[0]);
      }
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const loadListDetails = async (list: MovieList) => {
    setSelectedList(list);
    setItemsLoading(true);
    try {
      const res = await api.getList(list.id, list.share_token || undefined);
      setListItems(res.items);
    } catch (err) {
      console.error('Failed to load list items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.createList({
        title: newTitle,
        description: newDesc,
        is_watchlist: newIsWatchlist,
        visibility: newVisibility
      });
      setLists((prev) => [res.list, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      loadListDetails(res.list);
    } catch (err: any) {
      alert(`Error creating list: ${err.message}`);
    }
  };

  const handleToggleVisibility = async (listId: number, nextVisibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE') => {
    const prevLists = [...lists];
    const prevSelected = selectedList ? { ...selectedList } : null;

    // Optimistic immediate update
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, visibility: nextVisibility } : l))
    );
    if (selectedList && selectedList.id === listId) {
      setSelectedList((prev) => (prev ? { ...prev, visibility: nextVisibility } : null));
    }

    try {
      const res = await api.updateListVisibility(listId, nextVisibility);
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, visibility: res.list.visibility, share_token: res.list.share_token } : l))
      );
      if (selectedList && selectedList.id === listId) {
        setSelectedList((prev) => (prev ? { ...prev, visibility: res.list.visibility, share_token: res.list.share_token } : null));
      }
      if (nextVisibility === 'UNLISTED' && res.list.share_token) {
        setShareModalData({
          id: listId,
          token: res.list.share_token,
          title: res.list.title
        });
      }
    } catch (err: any) {
      // Revert on error
      setLists(prevLists);
      setSelectedList(prevSelected);
      alert(`Failed to update list visibility: ${err.message}`);
    }
  };

  const handleRemoveItem = async (tmdbId: number) => {
    if (!selectedList) return;
    const prevItems = [...listItems];
    // Optimistic immediate removal
    setListItems((prev) => prev.filter((i) => i.tmdb_id !== tmdbId));

    try {
      await api.removeMovieFromList(selectedList.id, tmdbId);
    } catch (err: any) {
      // Revert on error
      setListItems(prevItems);
      alert(`Failed to remove movie: ${err.message}`);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    const prevLists = [...lists];
    const prevSelected = selectedList ? { ...selectedList } : null;
    const prevItems = [...listItems];

    // Optimistic immediate deletion
    setLists((prev) => prev.filter((l) => l.id !== listId));
    if (selectedList?.id === listId) {
      setSelectedList(null);
      setListItems([]);
    }

    try {
      await api.deleteList(listId);
    } catch (err: any) {
      // Revert on error
      setLists(prevLists);
      setSelectedList(prevSelected);
      setListItems(prevItems);
      alert(`Failed to delete list: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Share Modal */}
      {shareModalData && (
        <ShareModal
          type="l"
          id={shareModalData.id}
          shareToken={shareModalData.token}
          title={shareModalData.title}
          onClose={() => setShareModalData(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
            Curated Lists & Watchlists
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Organize personal film collections with individual privacy locks.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-gold">
          <Plus size={16} /> New List
        </button>
      </div>

      {/* Split layout: Lists Sidebar / Main Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left: Lists sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Your Lists ({lists.length})
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading lists...</p>
          ) : lists.length === 0 ? (
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No lists yet.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                Create One
              </button>
            </div>
          ) : (
            lists.map((l) => {
              const isSelected = selectedList?.id === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => loadListDetails(l)}
                  style={{
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                      {Boolean(l.is_watchlist) ? <Bookmark size={15} color="var(--accent-gold)" /> : <List size={15} color="var(--accent-cyan)" />}
                      <span>{l.title}</span>
                    </div>
                    <PrivacyBadge visibility={l.visibility} showLabel={false} />
                  </div>

                  {l.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.description}
                    </p>
                  )}

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {l.item_count || 0} films • Created {typeof l.created_at === 'string' ? l.created_at.split('T')[0] : ''}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected List View */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          {selectedList ? (
            <div>
              {/* List Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{selectedList.title}</h2>
                    <PrivacyBadge visibility={selectedList.visibility} />
                  </div>
                  {selectedList.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.4rem' }}>
                      {selectedList.description}
                    </p>
                  )}
                </div>

                {/* Bulk Privacy Controls & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <select
                    value={selectedList.visibility}
                    onChange={(e) => handleToggleVisibility(selectedList.id, e.target.value as any)}
                    style={{
                      background: 'var(--bg-input)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="PRIVATE">🔒 Private</option>
                    <option value="UNLISTED">🔗 Unlisted</option>
                    <option value="PUBLIC">🌐 Public</option>
                  </select>

                  {selectedList.visibility === 'UNLISTED' && selectedList.share_token && (
                    <button
                      type="button"
                      onClick={() =>
                        setShareModalData({
                          id: selectedList.id,
                          token: selectedList.share_token!,
                          title: selectedList.title
                        })
                      }
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: 'var(--accent-cyan)' }}
                    >
                      <Share2 size={14} /> Secret Link
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteList(selectedList.id)}
                    className="btn btn-danger"
                    style={{ padding: '0.4rem 0.65rem' }}
                    title="Delete list"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Items Grid */}
              {itemsLoading ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading films in list...</p>
              ) : listItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No films added to this list yet. Browse films on the Explore page and click "Add to List"!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.25rem' }}>
                  {listItems.map((item) => {
                    const posterUrl = item.poster_path
                      ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w300${item.poster_path}`)
                      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';

                    return (
                      <div key={item.tmdb_id} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                        <img src={posterUrl} alt={item.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.tmdb_id)}
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#f87171',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove from list"
                        >
                          <X size={14} />
                        </button>
                        <div style={{ padding: '0.5rem' }}>
                          <h5 style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </h5>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.release_year}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
              Select a list from the left or create a new one.
            </p>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create New Curated List</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="modal-body">
              <div className="form-group">
                <label>List Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2020s Sci-Fi Masterpieces, Cozy Rainy Day Films..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Short description of this curated collection..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label>Privacy Setting</label>
                <PrivacyToggle value={newVisibility} onChange={setNewVisibility} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  checked={newIsWatchlist}
                  onChange={(e) => setNewIsWatchlist(e.target.checked)}
                  style={{ accentColor: 'var(--accent-gold)' }}
                />
                <span>Set as primary Watchlist</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
