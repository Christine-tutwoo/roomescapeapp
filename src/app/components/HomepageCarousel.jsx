'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { readCache, writeCache } from '@/lib/clientCache';

const CACHE_KEY = 'sheet-cache:homepage';
const CACHE_TTL = Number(process.env.NEXT_PUBLIC_SHEET_CACHE_TTL_MS || 5 * 60 * 1000);

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

async function fetchSlidesFromApi() {
  const response = await fetch('/api/sheets/home', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch homepage slides');
  }
  const { data } = await response.json();
  return Array.isArray(data) ? data : [];
}

export default function HomepageCarousel() {
  const [sources, setSources] = useState([]);
  const [status, setStatus] = useState('loading');
  const slides = useMemo(() => {
    if (!Array.isArray(sources)) return [];
    return sources
      .map((url, index) => buildSlide(url, index))
      .filter((slide) => !!slide);
  }, [sources]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const cached = readCache(CACHE_KEY, CACHE_TTL);
    if (cached && !cancelled) {
      setSources(cached);
      setStatus('ready');
    }

    if (!cached) {
      setStatus('loading');
      fetchSlidesFromApi()
        .then((data) => {
          if (cancelled) return;
          setSources(data);
          setStatus('ready');
          writeCache(CACHE_KEY, data);
        })
        .catch((error) => {
          console.error('[HomepageCarousel] fetch failed', error);
          if (!cancelled) setStatus('error');
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (status === 'loading') {
    return (
      <div className="aspect-video rounded-[2.5rem] border border-accent-beige/30 bg-white/70 flex items-center justify-center text-text-secondary text-sm animate-pulse">
        載入首頁內容…
      </div>
    );
  }

  if (slides.length === 0 || status === 'error') {
    return (
      <div className="aspect-video rounded-[2.5rem] border border-accent-beige/30 bg-white/70 flex items-center justify-center text-text-secondary text-sm">
        目前沒有可顯示的內容
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

