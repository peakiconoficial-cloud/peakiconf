import React, { useState, useEffect } from 'react';
import api from '../api';

const PlaylistModal = ({ isOpen, onClose, mediaItemId }) => {
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccessMsg(false);
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/user/profile');
      setPlaylists(res.data.playlists || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('You need to log in to save to a playlist.');
      } else {
        setError('Error fetching playlists.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      const res = await api.post('/user/playlists', { name: newPlaylistName });
      setPlaylists([...playlists, res.data]);
      setNewPlaylistName('');
    } catch (err) {
      setError('Error creating playlist.');
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await api.post(`/user/playlists/${playlistId}/items`, { mediaItemId });
      setSuccessMsg(true);
      setTimeout(() => {
        onClose();
        setSuccessMsg(false);
      }, 1500);
    } catch (err) {
      setError('Error saving to playlist.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <h2 className="text-xl font-bold mb-4 glow-text-pink text-white">Save to Playlist</h2>

        {successMsg ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 shadow-neon-pink">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="text-xl font-bold text-white glow-text-pink">Saved to playlist!</h2>
          </div>
        ) : error ? (
          <div className="text-red-400 mb-4">{error}</div>
        ) : loading ? (
          <div className="text-gray-400 mb-4">Loading playlists...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {playlists.length === 0 ? (
              <div className="text-gray-500">No playlists yet.</div>
            ) : (
              <ul className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {playlists.map(p => {
                  const isSaved = p.item_ids && p.item_ids.includes(mediaItemId);
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => !isSaved && handleAddToPlaylist(p.id)}
                        disabled={isSaved}
                        className={`w-full text-left flex justify-between items-center px-4 py-2 rounded-xl transition-all border ${
                          isSaved 
                            ? 'bg-primary/20 text-primary border-primary/50 shadow-neon-pink cursor-default' 
                            : 'bg-black/40 text-white border-transparent hover:bg-primary/20 hover:text-primary hover:border-primary/50'
                        }`}
                      >
                        <span>{p.name}</span>
                        {isSaved && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-white/10 pt-4 mt-2">
              <form onSubmit={handleCreatePlaylist} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/50 disabled:opacity-50 disabled:border-gray-600 disabled:text-gray-400 text-sm font-bold transition-all"
                >
                  Create
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;
