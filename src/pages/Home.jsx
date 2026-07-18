import React, { useState } from 'react';
import VideoFeed from '../components/VideoFeed';
import ImageGrid from '../components/ImageGrid';

const Home = () => {
  const [activeTab, setActiveTab] = useState('videos');

  return (
    <div className="h-full w-full">
      {/* Top bar with logo and tabs */}
      <div className="sticky top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-white/5">
        {/* Logo */}
        <div className="flex justify-center pt-2 pb-0">
          <img 
            src="/logo.png" 
            alt="PeakIcon" 
            className="h-14 object-contain"
          />
        </div>
        {/* Tabs */}
        <div className="flex justify-center gap-4 px-4 pb-3">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
              activeTab === 'videos' 
                ? 'bg-primary/20 text-primary border border-primary/50 shadow-neon-pink' 
                : 'bg-black/40 text-gray-400 border border-white/10 hover:text-white'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
              activeTab === 'photos' 
                ? 'bg-cyan/20 text-cyan border border-cyan/50 shadow-neon-cyan' 
                : 'bg-black/40 text-gray-400 border border-white/10 hover:text-white'
            }`}
          >
            Photos
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-0">
        {activeTab === 'videos' ? <VideoFeed /> : <ImageGrid />}
      </div>
    </div>
  );
};

export default Home;
