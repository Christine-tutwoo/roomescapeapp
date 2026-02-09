'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { readCache, writeCache, shouldUpdateCache } from '@/lib/clientCache';

const CACHE_KEY = 'sheet-cache:homepage';
// 快取時間：一個禮拜（7天）
const CACHE_TTL = Number(process.env.NEXT_PUBLIC_SHEET_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000);
// 圖片顯示時間（毫秒）
const IMAGE_DISPLAY_TIME = 6000;
// 影片最大等待時間（毫秒）- 作為備援，防止 postMessage 失效
const VIDEO_MAX_WAIT_TIME = 120000; // 2 分鐘

// 從 URL 提取 YouTube video ID
function extractVideoId(url) {
  if (typeof url !== 'string' || url.startsWith('data:image/') || url.startsWith('data:video/')) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '').replace('m.', '');

    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
      if (parsed.pathname.includes('/embed/')) {
        return parsed.pathname.split('/embed/')[1]?.split('?')[0];
      } else if (parsed.pathname.includes('/v/')) {
        return parsed.pathname.split('/v/')[1]?.split('?')[0];
      } else if (parsed.pathname.includes('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1]?.split('?')[0];
      } else if (hostname === 'youtu.be') {
        return parsed.pathname.replace(/^\//, '').split('?')[0];
      } else {
        return parsed.searchParams.get('v');
      }
    }
  } catch {
    // URL 解析失敗
  }
  return null;
}

function buildSlide(url, index) {
  if (!url || typeof url !== 'string') return null;

  const videoId = extractVideoId(url);
  return {
    id: `${index}-${url.substring(0, 50)}`,
    type: videoId ? 'video' : 'image',
    videoId: videoId,
    src: url,
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
  const [active, setActive] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
  const timerRef = useRef(null);
  const playerRef = useRef(null);
  const progressKey = useRef(0);

  const slides = useMemo(() => {
    if (!Array.isArray(sources)) return [];
    return sources
      .map((url, index) => buildSlide(url, index))
      .filter((slide) => !!slide);
  }, [sources]);

  // 跳到下一個 slide（帶動畫）
  const goToNext = useCallback(() => {
    if (slides.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActive((prev) => (prev + 1) % slides.length);
      progressKey.current += 1;
      setIsTransitioning(false);
    }, 150);
  }, [slides.length]);

  // 跳到前一個 slide（帶動畫）
  const goToPrev = useCallback(() => {
    if (slides.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActive((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      progressKey.current += 1;
      setIsTransitioning(false);
    }, 150);
  }, [slides.length]);

  // 跳到指定 slide（帶動畫）
  const goToSlide = useCallback((index) => {
    if (index === active) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActive(index);
      progressKey.current += 1;
      setIsTransitioning(false);
    }, 150);
  }, [active]);

  // 載入 YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const markReady = () => {
      if (!cancelled) {
        setIsYouTubeReady(true);
      }
    };

    if (window.YT && window.YT.Player) {
      markReady();
      return;
    }

    const previousHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousHandler?.();
      markReady();
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // 建立 / 銷毀 YouTube Player
  useEffect(() => {
    const currentSlide = slides[active];
    if (!isYouTubeReady || currentSlide?.type !== 'video') {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    const containerId = `carousel-video-${currentSlide.videoId}`;
    // 若 DOM 尚未渲染，稍後再試
    const containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    playerRef.current = new window.YT.Player(containerId, {
      videoId: currentSlide.videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          try {
            event.target.mute();
            event.target.playVideo();
          } catch {
            // ignore
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            goToNext();
          }
        },
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [active, slides, isYouTubeReady, goToNext]);

  // 當切換 slide 時重置載入狀態
  useEffect(() => {
    const currentSlide = slides[active];

    // 清除之前的計時器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentSlide?.type === 'image') {
      setImageLoading(true);
      setImageError(false);
      // 圖片使用固定時間
      if (slides.length > 1) {
        timerRef.current = setTimeout(goToNext, IMAGE_DISPLAY_TIME);
      }
    } else if (currentSlide?.type === 'video') {
      setImageLoading(false);
      setImageError(false);
      // 影片設置備援計時器，防止 postMessage 失效
      if (slides.length > 1) {
        timerRef.current = setTimeout(goToNext, VIDEO_MAX_WAIT_TIME);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, slides, goToNext]);

  // 載入資料
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const needsUpdate = await shouldUpdateCache(CACHE_KEY);

      if (needsUpdate && !cancelled) {
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
        const cached = readCache(CACHE_KEY, CACHE_TTL);
        if (cached && !cancelled) {
          setSources(cached);
          setStatus('ready');
        } else {
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

  // 元件卸載時清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="aspect-video rounded-xl overflow-hidden relative bg-card border-2 border-foreground" style={{ boxShadow: '8px 8px 0px 0px #E2E8F0' }}>
        <div className="absolute inset-0 carousel-loading-shimmer" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            載入首頁內容…
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0 || status === 'error') {
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-card border-2 border-foreground flex items-center justify-center text-muted-foreground text-sm font-medium" style={{ boxShadow: '8px 8px 0px 0px #E2E8F0' }}>
        目前沒有可顯示的內容
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-card border-2 border-foreground flex flex-col items-center justify-center text-muted-foreground text-sm p-4" style={{ boxShadow: '8px 8px 0px 0px #E2E8F0' }}>
        <div className="font-medium">圖片載入失敗</div>
        <div className="mt-2 text-xs text-secondary text-center">
          請檢查圖片 URL 是否正確
          <br />
          <span className="text-[10px] break-all">{slides[active]?.src?.substring(0, 80)}...</span>
        </div>
      </div>
    );
  }

  const currentSlide = slides[active];

  const videoContainerId = currentSlide.type === 'video' ? `carousel-video-${currentSlide.videoId}` : null;

  return (
    <div className="relative group">
      {/* 主要輪播區域 - Playful Geometric 風格 */}
      <div className="aspect-video rounded-xl overflow-hidden bg-black relative w-full border-2 border-foreground transition-all duration-300 hover:-rotate-1 hover:scale-[1.01]" style={{ boxShadow: '8px 8px 0px 0px #1E293B' }}>
        {/* 幾何裝飾形狀 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-4 right-4 w-16 h-16 bg-accent rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-tertiary rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-secondary transform -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </div>

        {/* 內容切換動畫容器 */}
        <div
          className={`w-full h-full transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
            }`}
        >
          {currentSlide.type === 'video' ? (
            <div className="w-full h-full relative" key={`video-${active}-${currentSlide.videoId}`}>
              {!isYouTubeReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm z-10 font-bold">
                  影片載入中…
                </div>
              )}
              <div id={videoContainerId} className="w-full h-full" />
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="flex items-center gap-3 text-white text-sm font-bold">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    載入中...
                  </div>
                </div>
              )}
              <div className="w-full h-full overflow-hidden">
                <img
                  key={currentSlide.id}
                  src={currentSlide.src}
                  alt={`carousel-${active}`}
                  className="w-full h-full object-contain object-center carousel-slide-enter carousel-slide-image"
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  onLoad={() => {
                    setImageError(false);
                    setImageLoading(false);
                  }}
                />
              </div>
              {!imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none transition-opacity duration-500" />
              )}
            </>
          )}
        </div>

        {/* 進度條（僅圖片時顯示）- Playful Geometric 風格 */}
        {currentSlide.type === 'image' && slides.length > 1 && !imageLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              key={`progress-${progressKey.current}`}
              className="h-full bg-accent carousel-progress rounded-full"
              style={{ '--progress-duration': `${IMAGE_DISPLAY_TIME}ms` }}
            />
          </div>
        )}
      </div>

      {/* 導航按鈕 - Playful Geometric 風格 */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="上一張"
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card text-foreground p-3 carousel-nav-btn opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 active:scale-95 border-2 border-foreground"
            style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="下一張"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card text-foreground p-3 carousel-nav-btn opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 active:scale-95 border-2 border-foreground"
            style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>

          {/* 指示點 - Playful Geometric 風格 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full bg-foreground/90 border-2 border-foreground" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.id}
                className={`w-2.5 h-2.5 rounded-full border-2 border-white/50 carousel-dot transition-all duration-300 ${active === index
                    ? 'bg-accent border-accent carousel-dot-active'
                    : 'bg-white/30 hover:bg-white/60 active:scale-95'
                  }`}
                onClick={() => goToSlide(index)}
                aria-label={`切換至第 ${index + 1} 張`}
              />
            ))}
          </div>
        </>
      )}

      {/* 計數器標籤 - Playful Geometric 風格 */}
      {slides.length > 1 && (
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-foreground text-accent-foreground text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 border-foreground" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
          {active + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}
