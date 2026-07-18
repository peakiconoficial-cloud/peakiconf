import React, { useState, useEffect } from 'react';
import api from '../api';
import ConfirmModal from '../components/ConfirmModal';

const Admin = () => {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminKey'));
  
  const [singleUrl, setSingleUrl] = useState('');
  const [singleTitle, setSingleTitle] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState(null); // { success, message }

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  
  const [albumsList, setAlbumsList] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    if (isAuthenticated) fetchAlbums();
  }, [isAuthenticated]);

  const fetchAlbums = async () => {
    try {
      const res = await api.get('/media/albums');
      setAlbumsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loginAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.get('/admin/verify', {
        headers: { 'x-admin-key': adminKey }
      });
      localStorage.setItem('adminKey', adminKey);
      setIsAuthenticated(true);
    } catch (err) {
      alert('Invalid Admin Secret Key');
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminKey');
    setIsAuthenticated(false);
  };

  const handleAddSingle = async (e) => {
    e.preventDefault();
    if (addLoading) return; // prevent double submit
    setAddLoading(true);
    setAddResult(null);
    try {
      // 3 minute timeout: large albums (100+ items) take time
      const res = await api.post('/admin/albums', { eromeUrl: singleUrl, title: singleTitle }, { timeout: 180000 });
      setAddResult({ success: true, message: res.data.message || 'Album added successfully!' });
      setSingleUrl('');
      setSingleTitle('');
      fetchAlbums();
    } catch (err) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Timeout: the album took too long to process. Reload to check if it was added.'
        : (err.response?.data?.error || 'Error adding album');
      setAddResult({ success: false, message: msg });
    } finally {
      setAddLoading(false);
    }
  };

  const handleAiAdd = async (e) => {
    e.preventDefault();
    if (aiLoading || !aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResults(null);
    try {
      // 5 min timeout for bulk parsing and downloading multiple albums
      const res = await api.post('/admin/albums/ai-add', { prompt: aiPrompt }, { timeout: 300000 });
      setAiResults(res.data);
      setAiPrompt('');
      fetchAlbums();
    } catch (err) {
      setAiResults({ 
        success: false, 
        error: err.response?.data?.error || err.message || 'Error processing AI request' 
      });
    } finally {
      setAiLoading(false);
    }
  };

  const deleteAlbum = (albumId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Album',
      message: 'Are you sure you want to delete this album?',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/albums/${albumId}`);
          alert('Album deleted');
          fetchAlbums();
        } catch (err) {
          console.error(err);
          alert('Error deleting album');
        }
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="glass-panel p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold mb-6 text-center glow-text-cyan text-cyan">Admin Access</h2>
          <form onSubmit={loginAdmin} className="flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Admin Secret Key" 
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-cyan transition-colors"
              required
            />
            <button 
              type="submit"
              className="bg-cyan/20 text-cyan border border-cyan/50 hover:bg-cyan/40 rounded-full py-2 font-bold shadow-neon-cyan transition-all"
            >
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold glow-text-cyan text-cyan">Admin Dashboard</h1>
        <button onClick={logoutAdmin} className="text-sm text-gray-400 hover:text-white">Lock Admin</button>
      </div>

      <div className="mb-12 max-w-md">
        {/* Single Add */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold mb-4">Add Album</h2>
          <form onSubmit={handleAddSingle} className="flex flex-col gap-4">
            <input 
              type="url" 
              placeholder="Erome URL" 
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan"
              required
            />
            <input 
              type="text" 
              placeholder="Album Title (Optional)" 
              value={singleTitle}
              onChange={(e) => setSingleTitle(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan"
            />
            <button
              type="submit"
              disabled={addLoading}
              className="bg-cyan/20 text-cyan border border-cyan/50 hover:bg-cyan/40 disabled:opacity-60 disabled:cursor-wait rounded-full py-2 font-bold transition-all text-sm mt-2 flex items-center justify-center gap-2"
            >
              {addLoading ? (
                <>
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Processing... (can take up to 2 min for large albums)
                </>
              ) : 'Add Album'}
            </button>
            {addResult && (
              <div className={`mt-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                addResult.success
                  ? 'bg-cyan/10 text-cyan border border-cyan/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {addResult.message}
              </div>
            )}
          </form>
        </div>

        {/* AI Bulk Add */}
        <div className="glass-panel p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h2 className="text-lg font-bold glow-text-pink">AI Bulk Add</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Paste plain text with links and names (e.g. "Add link1 called Summer, and link2 called Winter"). 
            The AI will automatically extract and process them.
          </p>
          <form onSubmit={handleAiAdd} className="flex flex-col gap-4">
            <textarea
              placeholder="Paste text containing Erome URLs and titles here..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-pink-500 min-h-[100px] resize-y"
              required
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/40 disabled:opacity-60 disabled:cursor-wait rounded-full py-2 font-bold transition-all text-sm mt-2 flex items-center justify-center gap-2 shadow-neon-pink"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  AI is working... (this might take a few minutes)
                </>
              ) : 'Process with AI'}
            </button>
          </form>
          
          {aiResults && (
            <div className="mt-4 bg-black/60 border border-white/10 rounded-xl p-4 text-sm max-h-60 overflow-y-auto hide-scrollbar">
              {aiResults.success === false ? (
                <div className="text-red-400 font-semibold mb-2">Error: {aiResults.error}</div>
              ) : (
                <>
                  <div className="text-green-400 font-bold mb-3">
                    Found {aiResults.parsedCount} albums!
                  </div>
                  <ul className="flex flex-col gap-2">
                    {aiResults.results?.map((res, i) => (
                      <li key={i} className={`flex justify-between items-start border-b border-white/5 pb-2 ${res.success ? 'text-gray-300' : 'text-red-400'}`}>
                        <div className="truncate pr-4 flex-1">
                          <span className="font-semibold block truncate">{res.url}</span>
                          {res.success ? (
                            <span className="text-xs text-cyan">{res.count} items downloaded</span>
                          ) : (
                            <span className="text-xs">Failed: {res.error}</span>
                          )}
                        </div>
                        {res.success ? (
                          <svg className="text-green-500 mt-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg className="text-red-500 mt-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Management Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Manage Albums</h2>
        {albumsList.length === 0 ? (
          <p className="text-gray-500">No albums in database.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {albumsList.map(album => (
              <div key={album.id} className="glass-panel p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{album.title || 'Untitled'}</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-md">{album.erome_url}</p>
                </div>
                <button 
                  onClick={() => deleteAlbum(album.id)}
                  className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40 rounded-full px-4 py-1 text-sm font-bold transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};

export default Admin;
