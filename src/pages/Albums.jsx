import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getProxyUrl, getVideoThumbnail } from '../api';
import VideoPlayer from '../components/VideoPlayer';
import PlaylistModal from '../components/PlaylistModal';

const Albums = () => {
  const location = useLocation();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumItems, setAlbumItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [fullScreenItemIndex, setFullScreenItemIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // active slide in full-screen player
  const [albumFilter, setAlbumFilter] = useState('all'); // 'all' | 'video' | 'image'
  const [savedAlbumIds, setSavedAlbumIds] = useState(new Set());
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
  }, [fullScreenItemIndex, albumItems, albumFilter]);

  useEffect(() => {
    const openAlbumId = location.state?.openAlbumId;

    const fetchAlbumsAndProfile = async () => {
      try {
        const [albumsRes, profileRes] = await Promise.allSettled([
          api.get('/media/albums'),
          localStorage.getItem('token') ? api.get('/user/profile') : Promise.resolve(null)
        ]);

        if (albumsRes.status === 'fulfilled') {
          setAlbums(albumsRes.value.data);
        }

        if (profileRes.status === 'fulfilled' && profileRes.value) {
          const ids = profileRes.value.data.savedAlbums.map(a => a.id);
          setSavedAlbumIds(new Set(ids));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (openAlbumId) {
      // Fast-path: directly fetch and open the target album without waiting for the full list
      setLoading(false);
      setAlbumFilter('all');
      setItemsLoading(true);
      api.get(`/media/albums/${openAlbumId}`)
        .then(res => {
          setSelectedAlbum(res.data);
          setAlbumItems(res.data.items || []);
        })
        .catch(console.error)
        .finally(() => setItemsLoading(false));
      // Also load the full list in the background for the back button
      fetchAlbumsAndProfile();
    } else {
      fetchAlbumsAndProfile();
    }
  }, []);


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

  const saveAlbum = async (e, albumId) => {
    e.stopPropagation();
    if (savedAlbumIds.has(albumId)) return;
    try {
      await api.post(`/user/albums/${albumId}/save`);
      setSavedAlbumIds(prev => new Set(prev).add(albumId));
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert('Please login to save albums');
      } else {
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-4 text-cyan text-center mt-10">Loading Albums...</div>;

  // Derived state
  const filteredItems = albumFilter === 'all'
    ? albumItems
    : albumItems.filter(item => item.type === albumFilter);

  // Full screen player for an item within an album
  if (fullScreenItemIndex !== null) {
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

        <div 
          ref={scrollContainerRef}
          className="h-full w-full snap-y snap-mandatory overflow-y-scroll hide-scrollbar"
        >
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

  // Inside Album View
  if (selectedAlbum) {
    const videoCount = albumItems.filter(i => i.type === 'video').length;
    const imageCount = albumItems.filter(i => i.type === 'image').length;

    return (
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setSelectedAlbum(null)}
            className="p-2 glass-panel hover:text-primary transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-xl font-bold glow-text-cyan flex-1 truncate">{selectedAlbum.title || 'Untitled Album'}</h2>
          <button
            onClick={(e) => saveAlbum(e, selectedAlbum.id)}
            disabled={savedAlbumIds.has(selectedAlbum.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full transition-all flex-shrink-0 ${
              savedAlbumIds.has(selectedAlbum.id)
                ? 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed'
                : 'bg-cyan/20 text-cyan border border-cyan/50 hover:bg-cyan/40'
            }`}
          >
            {savedAlbumIds.has(selectedAlbum.id) ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                Saved
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                Save
              </>
            )}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'All', count: albumItems.length },
            { key: 'video', label: 'Videos', count: videoCount },
            { key: 'image', label: 'Photos', count: imageCount },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setAlbumFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                albumFilter === tab.key
                  ? 'bg-primary/20 text-primary border-primary/50 shadow-neon-pink'
                  : 'bg-black/40 text-gray-400 border-white/10 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  albumFilter === tab.key ? 'bg-primary/30' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {itemsLoading ? (
          <div className="text-center text-gray-400">Loading items...</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="aspect-square bg-gray-900 cursor-pointer overflow-hidden group relative"
                onClick={() => setFullScreenItemIndex(index)}
              >
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
                    alt="Album item" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-3 text-center text-gray-500 py-10">
                No {albumFilter === 'all' ? 'items' : albumFilter === 'video' ? 'videos' : 'photos'} in this album
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Albums Grid View
  return (
    <div className="p-4 pb-24">
      <div className="flex justify-center mb-4">
        <img src="/logo.png" alt="PeakIcon" className="h-12 object-contain" />
      </div>
      <h1 className="text-2xl font-bold mb-6 glow-text-cyan">All Albums</h1>
      {albums.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">No albums available.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {albums.map(album => (
            <div
              key={album.id}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative border border-white/10 bg-gray-900"
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
  );
};

export default Albums;
