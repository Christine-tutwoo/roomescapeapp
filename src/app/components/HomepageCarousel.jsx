'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

function toYoutubeEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
      }
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '');
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}`;
    }
  } catch {
    //
  }
  return null;
}

function buildSlide(url, index) {
  if (!url) return null;
  const embed = toYoutubeEmbed(url);
  return {
    id: `${index}-${url}`,
    type: embed ? 'video' : 'image',
    src: embed || url,
    original: url,
  };
}

export default function HomepageCarousel({ sources }) {
  const slides = useMemo(() => {
    if (!Array.isArray(sources)) return [];
    return sources
      .map((url, index) => buildSlide(url, index))
      .filter((slide) => !!slide);
  }, [sources]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="aspect-video rounded-[2.5rem] border border-accent-beige/30 bg-white/70 flex items-center justify-center text-text-secondary text-sm">
        尚未設定首頁展示內容
      </div>
    );
  }

  const currentSlide = slides[active];

  return (
    <div className="relative">
      <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-accent-beige/30 shadow-premium bg-black">
        {currentSlide.type === 'video' ? (
          <iframe
            key={currentSlide.id}
            src={currentSlide.src}
            title={`carousel-video-${active}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img
            key={currentSlide.id}
            src={currentSlide.src}
            alt={`carousel-${active}`}
            className="w-full h-full object-cover"
          />
        )}
        {currentSlide.type === 'image' && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="上一張"
            onClick={() => setActive((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white text-text-primary p-3 shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="下一張"
            onClick={() => setActive((prev) => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white text-text-primary p-3 shadow-lg"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.id}
                className={`w-3 h-3 rounded-full border border-white/70 transition-all ${active === index ? 'bg-white scale-110' : 'bg-transparent'}`}
                onClick={() => setActive(index)}
                aria-label={`切換至第 ${index + 1} 張`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white/80 text-text-primary px-3 py-1 rounded-full text-xs font-semibold shadow-md">
        {currentSlide.type === 'video' ? <Play size={14} /> : null}
        精選第 {active + 1} 張
      </div>
    </div>
  );
}

