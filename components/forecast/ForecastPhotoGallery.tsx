'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface Photo {
  id: string;
  url: string;
  caption: string;
  sizes: {
    large: string;
    medium: string;
    thumbnail: string;
    original: string;
  };
}

interface ForecastPhotoGalleryProps {
  photos: Photo[];
  className?: string;
}

export default function ForecastPhotoGallery({
  photos,
  className = ''
}: ForecastPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === photos.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  return (
    <>
      {/* Photo Grid */}
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
        {photos.map((photo, index) => (
          <button
            key={photo.id || index}
            onClick={() => openLightbox(index)}
            className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-glacier transition-all"
            aria-label={`View photo ${index + 1}`}
          >
            <img
              src={photo.sizes.thumbnail || photo.sizes.medium || photo.url}
              alt={photo.caption ? `Field photo: ${photo.caption.substring(0, 100)}` : `Field photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-xs text-white font-medium line-clamp-2">
                {photo.caption && <span dangerouslySetInnerHTML={{ __html: photo.caption.substring(0, 100) }} />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            aria-label="Close photo viewer"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image and Caption Container */}
          <div
            className="max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative flex-1 flex items-center justify-center mb-4">
              <img
                src={photos[selectedIndex].sizes.large || photos[selectedIndex].sizes.original || photos[selectedIndex].url}
                alt={photos[selectedIndex].caption || `Field photo ${selectedIndex + 1}`}
                className="max-w-full max-h-[calc(90vh-120px)] object-contain rounded-lg"
              />
            </div>

            {/* Caption */}
            {photos[selectedIndex].caption && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-h-32 overflow-y-auto">
                <div
                  className="text-sm text-white/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: photos[selectedIndex].caption }}
                />
              </div>
            )}

            {/* Photo Counter */}
            <div className="text-center text-white/60 text-sm mt-2">
              {selectedIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
