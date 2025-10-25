import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselWithThumbnailsProps {
  images: string[];
  alt: string;
}

export function ImageCarouselWithThumbnails({ images, alt }: ImageCarouselWithThumbnailsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return <div className="w-full h-96 bg-gray-200 flex items-center justify-center">No images</div>;
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "ArrowRight") goToNext();
  };

  // Auto-focus carousel for keyboard navigation
  useEffect(() => {
    mainImageRef.current?.focus();
  }, []);

  // Scroll selected thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeThumb = thumbnailsRef.current.querySelector(`[data-active="true"]`);
      if (activeThumb) {
        (activeThumb as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [currentIndex]);

  return (
    <div className="w-full" onKeyDown={handleKeyDown} tabIndex={0} ref={mainImageRef}>
      {/* Main Image */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden group">
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300"
          loading={currentIndex === 0 ? "eager" : "lazy"}
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white transition-opacity rounded-full shadow-lg"
              onClick={goToPrev}
              aria-label="Previous image"
              tabIndex={-1}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white transition-opacity rounded-full shadow-lg"
              onClick={goToNext}
              aria-label="Next image"
              tabIndex={-1}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
        
        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" ref={thumbnailsRef}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => goToIndex(idx)}
              data-active={idx === currentIndex}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-primary scale-105 shadow-lg"
                  : "border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100"
              }`}
              aria-label={`Go to image ${idx + 1}`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Hint */}
      <p className="text-xs text-muted-foreground text-center mt-2">
        Use arrow keys or click thumbnails to navigate
      </p>
    </div>
  );
}
