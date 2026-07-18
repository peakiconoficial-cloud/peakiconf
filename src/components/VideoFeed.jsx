import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getProxyUrl, getVideoThumbnail } from '../api';
import VideoPlayer from '../components/VideoPlayer';
import PlaylistModal from './PlaylistModal';

let cachedVideos = null;

const VideoFeed = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // active slide in full-screen player
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const scrollContainerRef = useRef(null);

  // Scroll to the selected index when entering full-screen player
  useEffect(() => {
    if (selectedIndex !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const child = container.children[selectedIndex];
      if (child) {
        child.scrollIntoView({ behavior: 'instant', block: 'start' });
        setCurrentIndex(selectedIndex);
      }
    }
  }, [selectedIndex]);

  // Track which slide is currently visible using IntersectionObserver on slides
  useEffect(() => {
    if (selectedIndex === null || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const observers = [];

    Array.from(container.children).forEach((child, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setCurrentIndex(index);
            }
          });
        },
        { root: container, threshold: 0.6 }
      );
      observer.observe(child);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [selectedIndex, videos]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (cachedVideos) {
        setVideos(cachedVideos);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/media/random/videos');
        cachedVideos = res.data;
        setVideos(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const openPlayer = useCallback((index) => {
    setSelectedIndex(index);
    setCurrentIndex(index);
  }, []);

  if (loading) return <div className="text-center mt-10 text-primary animate-pulse">Loading Videos...</div>;
  if (videos.length === 0) return <div className="text-center mt-10 text-gray-400">No videos found.</div>;

  // Full screen player
  if (selectedIndex !== null) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        <button
          className="absolute top-4 left-4 p-2 bg-black/60 text-white rounded-full z-20 backdrop-blur border border-white/10"
          onClick={() => setSelectedIndex(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <PlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          mediaItemId={currentVideoId}
        />

        <div
          ref={scrollContainerRef}
          className="h-full w-full snap-y snap-mandatory overflow-y-scroll hide-scrollbar"
        >
          {videos.map((video, index) => {
            // Virtual windowing: only activate 1 before and 1 after current
            const isActive = index === currentIndex;
            const isNext = index === currentIndex + 1;
            const isPrev = index === currentIndex - 1;
            const inWindow = isActive || isNext || isPrev;

            return (
              <div
                key={video.id}
                className="h-full w-full snap-start relative flex items-center justify-center bg-black shrink-0"
              >
                {inWindow ? (
                  <VideoPlayer
                    src={getProxyUrl(video.direct_url)}
                    isActive={isActive}
                    preloadNext={isNext}
                  />
                ) : (
                  // Outside window: show thumbnail placeholder only
                  <img
                    src={getVideoThumbnail(video.direct_url)}
                    alt="Video thumbnail"
                    className="w-full h-full object-contain opacity-30"
                  />
                )}

                {/* Album pill */}
                <div className="absolute bottom-20 left-4 z-10 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/albums', { state: { openAlbumId: video.album_id } });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 backdrop-blur-md border border-white/30 text-white text-sm font-bold hover:bg-primary/40 hover:text-primary transition-all shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    {video.album_title || 'View Album'}
                  </button>
                </div>

                {/* Save to playlist */}
                <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4 z-10">
                  <button
                    onClick={() => {
                      setCurrentVideoId(video.id);
                      setIsPlaylistModalOpen(true);
                    }}
                    className="bg-surface backdrop-blur-md p-3 rounded-full border border-white/20 text-white hover:text-primary transition-colors"
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

  // Gallery grid
  return (
    <div className="grid grid-cols-3 gap-1 p-1 pb-24">
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="aspect-square bg-gray-900 cursor-pointer overflow-hidden group relative"
          onClick={() => openPlayer(index)}
        >
          {/* Thumbnail image derived from video URL */}
          <img
            src={getVideoThumbnail(video.direct_url)}
            alt={video.album_title || 'Video thumbnail'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          {/* Play icon badge */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
            <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center shadow-neon-pink">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
          {/* Video icon top-right */}
          <div className="absolute top-1 right-1 p-1 bg-black/50 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoFeed;
