'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { readCache, writeCache, shouldUpdateCache } from '@/lib/clientCache';

const CACHE_KEY = 'sheet-cache:homepage';
// 快取時間：一個禮拜（7天）
const CACHE_TTL = Number(process.env.NEXT_PUBLIC_SHEET_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000);
// 圖片顯示時間（秒）
const IMAGE_DISPLAY_TIME = 6000;

// 從 URL 提取 YouTube video ID
function extractVideoId(url) {
  if (typeof url !== 'string' || url.startsWith('data:image/') || url.startsWith('data:video/')) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '').replace('m.', '');

    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
      // 格式 1: youtube.com/watch?v=VIDEO_ID
      // 格式 2: youtube.com/embed/VIDEO_ID
      // 格式 3: youtube.com/v/VIDEO_ID
      // 格式 4: youtu.be/VIDEO_ID
      // 格式 5: youtube.com/shorts/VIDEO_ID
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
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const timerRef = useRef(null);

  const slides = useMemo(() => {
    if (!Array.isArray(sources)) return [];
    return sources
      .map((url, index) => buildSlide(url, index))
      .filter((slide) => !!slide);
  }, [sources]);

  // 跳到下一個 slide
  const goToNext = useCallback(() => {
    if (slides.length <= 1) return;
    setActive((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // 當切換 slide 時重置載入狀態（僅針對圖片）
  useEffect(() => {
    const currentSlide = slides[active];
    if (currentSlide?.type === 'image') {
      setImageLoading(true);
      setImageError(false);
    } else {
      setImageLoading(false);
      setImageError(false);
    }
  }, [active, slides]);

  // 載入 YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 如果 API 已經載入，不需要再次載入
    if (window.YT && window.YT.Player) return;

    // 載入 YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }, []);

  // 處理 YouTube 播放器的建立與事件
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (slides.length === 0) return;

    const currentSlide = slides[active];

    // 清除之前的計時器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 銷毀之前的播放器
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // 忽略錯誤
      }
      playerRef.current = null;
    }

    // 如果是圖片，設定計時器
    if (currentSlide?.type === 'image') {
      if (slides.length > 1) {
        timerRef.current = setTimeout(goToNext, IMAGE_DISPLAY_TIME);
      }
      return;
    }

    // 如果是影片，建立 YouTube 播放器
    if (currentSlide?.type === 'video' && currentSlide.videoId) {
      const createPlayer = () => {
        if (!playerContainerRef.current) return;
        if (!window.YT || !window.YT.Player) {
          // API 還沒載入完成，稍後再試
          setTimeout(createPlayer, 100);
          return;
        }

        playerRef.current = new window.YT.Player(playerContainerRef.current, {
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
            onStateChange: (event) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === 0) {
                // 影片結束，跳到下一個
                goToNext();
              }
            },
            onError: () => {
              // 發生錯誤，5秒後跳到下一個
              if (slides.length > 1) {
                timerRef.current = setTimeout(goToNext, 5000);
              }
            },
          },
        });
      };

      createPlayer();
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

  // 元件卸載時清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // 忽略
        }
      }
    };
  }, []);

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
      <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-accent-beige/30 shadow-premium bg-black relative w-full">
        {currentSlide.type === 'video' ? (
          // YouTube 播放器容器 - 使用 div 讓 YT API 建立 iframe
          <div
            key={`player-${active}-${currentSlide.videoId}`}
            ref={playerContainerRef}
            className="w-full h-full"
          />
        ) : (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-white text-sm">載入中...</div>
              </div>
            )}
            <img
              key={currentSlide.id}
              src={currentSlide.src}
              alt={`carousel-${active}`}
              className="w-full h-full object-contain object-center"
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              onLoad={() => {
                setImageError(false);
                setImageLoading(false);
              }}
            />
            {!imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
            )}
          </>
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

    </div>
  );
}
