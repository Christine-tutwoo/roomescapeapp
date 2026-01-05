'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { readCache, writeCache, shouldUpdateCache } from '@/lib/clientCache';

const CACHE_KEY = 'sheet-cache:homepage';
// 快取時間：一個禮拜（7天）
const CACHE_TTL = Number(process.env.NEXT_PUBLIC_SHEET_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000);

function toYoutubeEmbed(url) {
  // 如果是 base64 data URL，直接返回 null（不是 YouTube）
  if (typeof url === 'string' && (url.startsWith('data:image/') || url.startsWith('data:video/'))) {
    return null;
  }
  
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
    // URL 解析失敗（可能是 base64 data URL 或其他格式）
  }
  return null;
}

function buildSlide(url, index) {
  if (!url || typeof url !== 'string') return null;
  
  const embed = toYoutubeEmbed(url);
  return {
    id: `${index}-${url.substring(0, 50)}`,
    type: embed ? 'video' : 'image',
    src: embed || url,
    original: url,
  };
}

async function fetchSlidesFromApi() {
  try {
    const response = await fetch('/api/sheets/home');
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    return [];
  }
}

export default function HomepageCarousel() {
  const [sources, setSources] = useState([]);
  const [status, setStatus] = useState('loading');
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const slides = useMemo(() => {
    if (!Array.isArray(sources)) return [];
    return sources
      .map((url, index) => buildSlide(url, index))
      .filter((slide) => !!slide);
  }, [sources]);

  const [active, setActive] = useState(0);
  
  // 當切換 slide 時重置載入狀態
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [active]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      // 先檢查版本時間，決定是否需要更新
      const needsUpdate = await shouldUpdateCache(CACHE_KEY);
      
      if (needsUpdate && !cancelled) {
        // 需要更新：直接載入最新數據
        setStatus('loading');
        fetchSlidesFromApi()
          .then((data) => {
            if (cancelled) return;
            setSources(data);
            setStatus('ready');
            writeCache(CACHE_KEY, data);
          })
          .catch(() => {
            if (!cancelled) {
              // 如果載入失敗，嘗試使用快取（如果有的話）
              const fallbackCache = readCache(CACHE_KEY, CACHE_TTL);
              if (fallbackCache) {
                setSources(fallbackCache);
                setStatus('ready');
              } else {
                setStatus('error');
              }
            }
          });
      } else {
        // 不需要更新：使用快取
        const cached = readCache(CACHE_KEY, CACHE_TTL);
        if (cached && !cancelled) {
          setSources(cached);
          setStatus('ready');
        } else {
          // 沒有快取，需要載入
          setStatus('loading');
          fetchSlidesFromApi()
            .then((data) => {
              if (cancelled) return;
              setSources(data);
              setStatus('ready');
              writeCache(CACHE_KEY, data);
            })
            .catch(() => {
              if (!cancelled) setStatus('error');
            });
        }
      }
    }

    loadData();

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

  if (imageError) {
    return (
      <div className="aspect-video rounded-[2.5rem] border border-accent-beige/30 bg-white/70 flex flex-col items-center justify-center text-text-secondary text-sm p-4">
        <div>圖片載入失敗</div>
        <div className="mt-2 text-xs text-red-500 text-center">
          請檢查圖片 URL 是否正確
          <br />
          <span className="text-[10px] break-all">{slides[active]?.src?.substring(0, 80)}...</span>
        </div>
      </div>
    );
  }

  const currentSlide = slides[active];

  return (
    <div className="relative">
      <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-accent-beige/30 shadow-premium bg-black relative">
        {imageLoading && currentSlide.type === 'image' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white text-sm">載入中...</div>
          </div>
        )}
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
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={() => {
              setImageError(false);
              setImageLoading(false);
            }}
          />
        )}
        {currentSlide.type === 'image' && !imageLoading && (
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

