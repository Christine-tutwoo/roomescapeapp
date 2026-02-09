'use client';

import { useEffect, useMemo, useState } from 'react';
import { Image, X, Sparkles, Ticket } from 'lucide-react';
import { readCache, writeCache, shouldUpdateCache } from '@/lib/clientCache';

const CACHE_KEY = 'sheet-cache:promotions';
// 快取時間：一個禮拜（7天）
const CACHE_TTL = Number(process.env.NEXT_PUBLIC_SHEET_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000);

async function fetchPromotionsFromApi() {
  try {
    const response = await fetch('/api/sheets/promotions');
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    return [];
  }
}

export default function PromotionsClient() {
  const [modalImage, setModalImage] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    
    async function loadData() {
      // 先檢查版本時間，決定是否需要更新
      const needsUpdate = await shouldUpdateCache(CACHE_KEY);
      
      if (needsUpdate && !cancelled) {
        // 需要更新：直接載入最新數據
        setStatus('loading');
        fetchPromotionsFromApi()
          .then((data) => {
            if (cancelled) return;
            setPromotions(data);
            setStatus('ready');
            writeCache(CACHE_KEY, data);
          })
          .catch(() => {
            if (!cancelled) {
              // 如果載入失敗，嘗試使用快取（如果有的話）
              const fallbackCache = readCache(CACHE_KEY, CACHE_TTL);
              if (fallbackCache) {
                setPromotions(fallbackCache);
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
          setPromotions(cached);
          setStatus('ready');
        } else {
          // 沒有快取，需要載入
          setStatus('loading');
          fetchPromotionsFromApi()
            .then((data) => {
              if (cancelled) return;
              setPromotions(data);
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

  const sorted = useMemo(() => {
    const list = Array.isArray(promotions) ? promotions.slice() : [];
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [promotions]);

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-24">
        <div className="py-6 md:py-10 space-y-12">
          {/* Hero Section */}
          <section className="relative">
            {/* 動態背景 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-tertiary/20 via-tertiary/5 to-transparent rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-accent/20 via-accent/5 to-transparent rounded-full blur-3xl animate-float-slow" />
            </div>

            <div className="relative z-10 text-center animate-pop-in">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent backdrop-blur-sm border-2 border-tertiary/30 mb-6">
                <Ticket size={18} className="text-tertiary" strokeWidth={2.5} />
                <span className="text-sm font-bold text-foreground uppercase tracking-wider">Promotions</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5">
                <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                  最新優惠情報
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                小迷糊幫你搜集全台優惠，省荷包也要玩得盡興。
              </p>
            </div>
          </section>

          {/* 優惠列表 */}
          <section className="space-y-6">
            {status === 'loading' ? (
              <div className="relative group animate-pop-in">
                <div className="absolute -inset-1 bg-gradient-to-br from-muted/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative card-premium p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">讀取最新優惠…</p>
                  </div>
                </div>
              </div>
            ) : sorted.length === 0 || status === 'error' ? (
              <div className="relative group animate-pop-in">
                <div className="absolute -inset-1 bg-gradient-to-br from-muted/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative card-premium p-12 text-center border-dashed">
                  <div className="flex flex-col items-center gap-4">
                    <Sparkles size={48} className="text-muted-foreground/50" strokeWidth={2.5} />
                    <p className="text-muted-foreground font-medium">目前尚無優惠，歡迎稍後再來查看。</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {sorted.map((promo, index) => (
                  <article
                    key={`${promo.order}-${promo.title}-${index}`}
                    className="relative group animate-pop-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* 背景光暈 */}
                    <div className="absolute -inset-1 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative card-premium p-6 sm:p-8 group-hover:scale-[1.01] transition-all duration-300">
                      {/* 裝飾元素 */}
                      <div className="absolute top-4 right-4 w-20 h-20 bg-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative z-10">
                        {/* 標題區 */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                              <span className="text-xl font-bold text-accent-foreground">#{promo.order || index + 1}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                              {promo.title}
                            </h3>
                          </div>
                        </div>

                        {/* 內容 */}
                        <p className="text-muted-foreground font-medium leading-relaxed whitespace-pre-line mb-6">
                          {promo.content}
                        </p>

                        {/* 查看圖片按鈕 */}
                        {promo.detailImageUrl && (
                          <div className="mt-6">
                            <button
                              type="button"
                              onClick={() => setModalImage(promo.detailImageUrl)}
                              className="btn-secondary group/btn inline-flex items-center justify-center gap-2 px-6 py-3 relative overflow-hidden"
                            >
                              <span className="absolute inset-0 bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                              <Image size={18} className="relative z-10 group-hover/btn:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                              <span className="relative z-10">查看活動圖片</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 圖片 Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setModalImage(null)}
        >
          <div 
            className="card-premium p-6 max-w-4xl w-full relative group" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 動態背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-card/80 to-tertiary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setModalImage(null)}
                  className="p-2 rounded-full bg-muted/50 hover:bg-muted border-2 border-foreground/10 hover:border-foreground/20 transition-all duration-300 group/btn"
                  aria-label="關閉"
                >
                  <X size={20} className="text-foreground group-hover/btn:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                </button>
              </div>
              <img 
                src={modalImage} 
                alt="優惠詳情" 
                className="w-full rounded-2xl border-2 border-foreground/10" 
                style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
