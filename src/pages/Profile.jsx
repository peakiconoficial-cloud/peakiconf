import React, { useState, useEffect, useRef } from 'react';
import api, { getProxyUrl, getVideoThumbnail } from '../api';
import VideoPlayer from '../components/VideoPlayer';
import PlaylistModal from '../components/PlaylistModal';
import ConfirmModal from '../components/ConfirmModal';

const Profile = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ playlists: [], savedAlbums: [] });
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Album view state
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [albumItems, setAlbumItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [fullScreenItemIndex, setFullScreenItemIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // active slide in full-screen player
  const [albumFilter, setAlbumFilter] = useState('all');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (fullScreenItemIndex !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const child = container.children[fullScreenItemIndex];
      if (child) {
        child.scrollIntoView({ behavior: 'instant', block: 'start' });
        setCurrentIndex(fullScreenItemIndex);
      }
    }
  }, [fullScreenItemIndex]);

  // Track visible slide via IntersectionObserver
  useEffect(() => {
    if (fullScreenItemIndex === null || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const observers = [];
    Array.from(container.children).forEach((child, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setCurrentIndex(index);
          });
        },
        { root: container, threshold: 0.6 }
      );
      observer.observe(child);
      observers.push(observer);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, [fullScreenItemIndex, albumItems]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      setProfileData(res.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const openAlbum = async (album) => {
    setSelectedAlbum(album);
    setAlbumFilter('all');
    setItemsLoading(true);
    try {
      const res = await api.get(`/media/albums/${album.id}`);
      setAlbumItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const openPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist);
    setAlbumFilter('all');
    setItemsLoading(true);
    try {
      const res = await api.get(`/user/playlists/${playlist.id}`);
      setAlbumItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const deletePlaylist = (playlistId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Apagar Playlist',
      message: 'Tem certeza que deseja apagar esta playlist?',
      onConfirm: async () => {
        try {
          await api.delete(`/user/playlists/${playlistId}`);
          setProfileData(prev => ({
            ...prev,
            playlists: prev.playlists.filter(p => p.id !== playlistId)
          }));
          if (selectedPlaylist && selectedPlaylist.id === playlistId) {
            setSelectedPlaylist(null);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const removePlaylistItem = (e, playlistId, mediaItemId) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Remover da Playlist',
      message: 'Deseja remover este item da playlist?',
      onConfirm: async () => {
        try {
          await api.delete(`/user/playlists/${playlistId}/items/${mediaItemId}`);
          setAlbumItems(prev => prev.filter(item => item.id !== mediaItemId));
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const unsaveAlbum = async (albumId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remover Álbum',
      message: 'Deseja remover este álbum dos seus álbuns guardados?',
      onConfirm: async () => {
        try {
          await api.delete(`/user/albums/${albumId}/save`);
          setProfileData(prev => ({
            ...prev,
            savedAlbums: prev.savedAlbums.filter(a => a.id !== albumId)
          }));
          if (selectedAlbum && selectedAlbum.id === albumId) {
            setSelectedAlbum(null);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    try {
      const res = await api.post(endpoint, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.error || 'Auth error');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="p-4 text-center mt-10">Loading...</div>;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="glass-panel p-8 w-full max-w-sm">
          <div className="flex gap-4 mb-6">
            <button 
              className={`flex-1 pb-2 font-bold transition-all ${isLogin ? 'text-primary border-b-2 border-primary glow-text-pink' : 'text-gray-500'}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`flex-1 pb-2 font-bold transition-all ${!isLogin ? 'text-primary border-b-2 border-primary glow-text-pink' : 'text-gray-500'}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              required
            />
            <button 
              type="submit"
              className="mt-4 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/40 rounded-full py-2 font-bold shadow-neon-pink transition-all"
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Full screen player for an item within an album
  if (fullScreenItemIndex !== null) {
    const filteredItems = albumFilter === 'all' ? albumItems : albumItems.filter(item => item.type === albumFilter);
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        <button 
          className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full z-10"
          onClick={() => setFullScreenItemIndex(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        
        <PlaylistModal 
          isOpen={isPlaylistModalOpen} 
          onClose={() => setIsPlaylistModalOpen(false)} 
          mediaItemId={currentMediaId} 
        />
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
        />

        <div ref={scrollContainerRef} className="h-full w-full snap-y snap-mandatory overflow-y-scroll hide-scrollbar">
          {filteredItems.map((item, index) => {
            const isActive = index === currentIndex;
            const isNext = index === currentIndex + 1;
            const isPrev = index === currentIndex - 1;
            const inWindow = isActive || isNext || isPrev;
            return (
            <div key={item.id} className="h-full w-full snap-start relative flex items-center justify-center bg-black shrink-0">
              {item.type === 'video' ? (
                inWindow ? (
                  <VideoPlayer
                    src={getProxyUrl(item.direct_url)}
                    isActive={isActive}
                    preloadNext={isNext}
                  />
                ) : (
                  <img
                    src={getVideoThumbnail(item.direct_url)}
                    alt="Video thumbnail"
                    className="w-full h-full object-contain opacity-30"
                  />
                )
              ) : (
                <img 
                  src={getProxyUrl(item.direct_url)} 
                  alt="Full screen photo" 
                  className="max-w-full max-h-full object-contain"
                />
              )}
              <div className="absolute right-4 bottom-6 flex flex-col items-center gap-4 z-10">
                <button 
                  onClick={() => {
                    setCurrentMediaId(item.id);
                    setIsPlaylistModalOpen(true);
                  }}
                  className="bg-surface backdrop-blur-md p-3 rounded-full border border-white/20 text-white hover:text-cyan transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Inside Album or Playlist View
  if (selectedAlbum || selectedPlaylist) {
    const isPlaylist = !!selectedPlaylist;
    const currentContainer = isPlaylist ? selectedPlaylist : selectedAlbum;
    const filteredItems = albumFilter === 'all' ? albumItems : albumItems.filter(item => item.type === albumFilter);
    const videoCount = albumItems.filter(i => i.type === 'video').length;
    const imageCount = albumItems.filter(i => i.type === 'image').length;

    return (
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => isPlaylist ? setSelectedPlaylist(null) : setSelectedAlbum(null)}
            className="p-2 glass-panel hover:text-primary transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-xl font-bold glow-text-cyan flex-1 truncate">{currentContainer.title || currentContainer.name || 'Untitled'}</h2>
          {!isPlaylist ? (
            <button
              onClick={() => unsaveAlbum(selectedAlbum.id)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/40 transition-all flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Unsave
            </button>
          ) : (
            <button
              onClick={() => deletePlaylist(selectedPlaylist.id)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/40 transition-all flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all', label: `All (${albumItems.length})` },
            { id: 'video', label: `Videos (${videoCount})` },
            { id: 'image', label: `Photos (${imageCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAlbumFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                albumFilter === tab.id
                  ? 'bg-cyan/20 text-cyan border border-cyan/50 shadow-neon-cyan'
                  : 'bg-black/40 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {itemsLoading ? (
          <div className="text-center mt-10 text-cyan">Loading items...</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="aspect-square bg-gray-900 cursor-pointer overflow-hidden group relative"
                onClick={() => setFullScreenItemIndex(index)}
              >
                {/* Remove from playlist button */}
                {isPlaylist && (
                  <button
                    onClick={(e) => removePlaylistItem(e, selectedPlaylist.id, item.id)}
                    className="absolute top-2 left-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white shadow-md hover:bg-red-500 z-10"
                    title="Remover da playlist"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}

                {item.type === 'video' ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={getVideoThumbnail(item.direct_url)}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-1 right-1 p-1 bg-black/50 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={getProxyUrl(item.direct_url)} 
                    alt="Album photo" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
        />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-center mb-4">
        <img src="/logo.png" alt="PeakIcon" className="h-12 object-contain" />
      </div>
      <div className="flex justify-between items-center mb-8 glass-panel p-4">
        <div>
          <h1 className="text-xl font-bold glow-text-pink">Hello, {user.username}</h1>
        </div>
        <button 
          onClick={logout}
          className="text-sm px-4 py-1 rounded-full border border-gray-500 text-gray-400 hover:text-white hover:border-white transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Minhas Playlists</h2>
        {profileData.playlists.length === 0 ? (
          <p className="text-gray-500">No playlists yet.</p>
        ) : (
          <ul className="space-y-2">
            {profileData.playlists.map(p => (
              <li 
                key={p.id} 
                className="glass-panel p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => openPlaylist(p)}
              >
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Álbuns Guardados</h2>
        {profileData.savedAlbums.length === 0 ? (
          <p className="text-gray-500">No saved albums.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {profileData.savedAlbums.map(album => (
              <div 
                key={album.id} 
                className="aspect-[3/4] bg-surface rounded-2xl overflow-hidden cursor-pointer group relative border border-white/10 shadow-lg"
                onClick={() => openAlbum(album)}
              >
                {/* Thumbnail */}
                {album.thumbnail_url ? (
                  <img
                    src={album.thumbnail_type === 'video' ? getVideoThumbnail(album.thumbnail_url) : getProxyUrl(album.thumbnail_url)}
                    alt={album.title || 'Album'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                )}

                {/* Dark gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none" />

                {/* Title + item count only */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-bold text-white text-sm leading-tight truncate drop-shadow-md">
                    {album.title || 'Untitled'}
                  </h3>
                  {album.item_count > 0 && (
                    <span className="text-xs bg-black/50 text-cyan border border-cyan/30 px-2 py-0.5 rounded-full backdrop-blur mt-1 inline-block">
                      {album.item_count} items
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
