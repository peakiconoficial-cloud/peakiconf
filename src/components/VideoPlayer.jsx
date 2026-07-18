import React, { useRef, useState, useEffect } from 'react';

/**
 * VideoPlayer
 *
 * Props:
 *  - src       : string  — proxy URL of the video
 *  - isActive  : boolean — when false, src is cleared and video is paused
 *                          to free the network connection (virtual windowing)
 *  - preloadNext: boolean — when true, loads metadata only (for next slide prefetch)
 */
const VideoPlayer = ({ src, isActive = true, preloadNext = false }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Manage src based on active state to avoid all videos loading simultaneously
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      if (video.src !== src) {
        video.src = src;
        video.load();
      }
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else if (preloadNext) {
      // Preload just metadata for the next video (very small download)
      if (video.src !== src) {
        video.preload = 'metadata';
        video.src = src;
        video.load();
      }
      video.pause();
      setIsPlaying(false);
    } else {
      // Completely unload — free the network connection
      video.pause();
      video.removeAttribute('src');
      video.load();
      setIsPlaying(false);
    }
  }, [isActive, preloadNext, src]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted={isMuted}
        preload={isActive ? 'auto' : preloadNext ? 'metadata' : 'none'}
      />

      {/* Mute toggle button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white z-20 backdrop-blur-sm border border-white/10"
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="11" y1="5" x2="11" y2="19"/><line x1="15" y1="9" x2="15" y2="15"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        )}
      </button>

      {/* Play/Pause indicator overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center backdrop-blur shadow-neon-pink">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
