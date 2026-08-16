import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({ images, initialIndex, open, onOpenChange }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrev, handleNext, onOpenChange]);

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-4xl border-none  !p-0 text-white shadow-none outline-none focus:outline-none"
      >
        <DialogTitle className="sr-only">معرض الصور</DialogTitle>
        <div className="relative flex items-center justify-center p-0">
          <div className="fixed inset-0 -z-10 bg-black/85 pointer-events-none" />
          
          <button
            onClick={() => onOpenChange(false)}
            className="absolute -top-6 right-0 z-50 rounded-full bg-black/50 p-2 text-white/80 hover:bg-black/80 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
          
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 z-40 rounded-full bg-black/50 p-3 text-white/80 hover:bg-black/80 hover:text-white transition-colors"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 z-40 rounded-full bg-black/50 p-3 text-white/80 hover:bg-black/80 hover:text-white transition-colors"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div className=" overflow-hidden rounded-lg">
            <img
              src={images[currentIndex]}
              alt=""
              className=" max-w-full object-contain select-none shadow-2xl"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
