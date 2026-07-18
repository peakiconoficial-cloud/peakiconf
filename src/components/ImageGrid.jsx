import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getProxyUrl } from '../api';
import PlaylistModal from './PlaylistModal';

let cachedImages = null;

const ImageGrid = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [currentImageId, setCurrentImageId] = useState(null);
  const scrollContainerRef = useRef(null);

  // Scroll to selected image when entering fullscreen
  useEffect(() => {
    if (selectedImageIndex !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const child = container.children[selectedImageIndex];
      if (child) {
        child.scrollIntoView({ behavior: 'instant', block: 'start' });
        setCurrentIndex(selectedImageIndex);
      }
    }
  }, [selectedImageIndex]);

  // Track current visible slide via IntersectionObserver
  useEffect(() => {
    if (selectedImageIndex === null || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setCurrentIndex(index);
          }
        });
      },
      { root: container, threshold: 0.51 }
    );
    
    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [selectedImageIndex, images]);

  useEffect(() => {
    const fetchImages = async () => {
      if (cachedImages) {
        setImages(cachedImages);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/media/random/images');
        cachedImages = res.data;
        setImages(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  if (loading) return <div className="text-center mt-10 text-cyan">Loading Photos...</div>;
  if (images.length === 0) return <div className="text-center mt-10 text-gray-400">No photos found.</div>;

  return (
    <>
      <div className="grid grid-cols-3 gap-1 p-1 pb-24">
        {images.map((image, index) => (
          <div 
            key={image.id} 
            className="aspect-square bg-gray-900 cursor-pointer overflow-hidden group"
            onClick={() => setSelectedImageIndex(index)}
          >
            <img 
              src={getProxyUrl(image.direct_url)} 
              alt="Random feed item" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <button 
            className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full z-10"
            onClick={() => setSelectedImageIndex(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          
          <PlaylistModal 
            isOpen={isPlaylistModalOpen} 
            onClose={() => setIsPlaylistModalOpen(false)} 
            mediaItemId={currentImageId} 
          />

          <div 
            ref={scrollContainerRef}
            className="h-full w-full snap-y snap-mandatory overflow-y-scroll hide-scrollbar"
          >
            {images.map((image, index) => {
              const isActive = index === currentIndex;
              const isNext = index === currentIndex + 1;
              const isPrev = index === currentIndex - 1;
              const inWindow = isActive || isNext || isPrev;
              
              return (
              <div key={image.id} data-index={index} className="h-full w-full snap-start snap-always relative flex items-center justify-center bg-black shrink-0">
                <img 
                  src={inWindow ? getProxyUrl(image.direct_url) : ''} 
                  alt="Full screen photo" 
                  className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${inWindow ? 'opacity-100' : 'opacity-0'}`}
                />
                
                {/* Overlays */}
                <div className="absolute bottom-6 left-4 z-10 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/albums', { state: { openAlbumId: image.album_id } });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 backdrop-blur-md border border-white/30 text-white text-sm font-bold hover:bg-cyan/40 hover:text-cyan transition-all shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    {image.album_title || 'View Album'}
                  </button>
                </div>
                <div className="absolute right-4 bottom-6 flex flex-col items-center gap-4 z-10">
                  <button 
                    onClick={() => {
                      setCurrentImageId(image.id);
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
      )}
    </>
  );
};

export default ImageGrid;
