'use client';

import { useEffect, useMemo, useState } from 'react';
import { Image, X } from 'lucide-react';
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
    <div className="min-h-screen bg-transparent text-[#212121] font-sans">
      <main className="max-w-5xl mx-auto py-8 px-4">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-[0.35em] text-[#C1B7AA] font-semibold mb-2">Promotions</p>
          <h2 className="text-3xl font-black text-[#212121] mb-2">最新優惠情報</h2>
          <p className="text-[#7A7A7A]">小迷糊幫你搜集全台優惠，省荷包也要玩得盡興。</p>
        </div>

        {status === 'loading' ? (
          <div className="bg-white/70 rounded-3xl border border-dashed border-[#EBE3D7] py-14 text-center text-[#7A7A7A] animate-pulse">
            讀取最新優惠…
          </div>
        ) : sorted.length === 0 || status === 'error' ? (
          <div className="bg-white/70 rounded-3xl border border-dashed border-[#EBE3D7] py-14 text-center text-[#7A7A7A]">
            目前尚無優惠，歡迎稍後再來查看。
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((promo, index) => (
              <article
                key={`${promo.order}-${promo.title}-${index}`}
                className="bg-white rounded-3xl border border-[#EBE3D7] p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-[#FFF4E6] text-[#FF8C00] text-xs font-bold">
                    #{promo.order || index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-[#212121]">{promo.title}</h3>
                </div>

                <p className="text-[#7A7A7A] leading-relaxed whitespace-pre-line">{promo.content}</p>

                {promo.detailImageUrl && (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setModalImage(promo.detailImageUrl)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FFD9A4] bg-[#FFF4E6] text-[#AC6500] text-sm font-semibold hover:bg-[#FFE8C5] transition-colors"
                    >
                      <Image size={16} />
                      查看活動圖片
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-2xl w-full" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="p-2 rounded-full bg-[#F3F0EB] hover:bg-[#EBE3D7] transition-colors"
                aria-label="關閉"
              >
                <X size={18} />
              </button>
            </div>
            <img src={modalImage} alt="優惠詳情" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}


