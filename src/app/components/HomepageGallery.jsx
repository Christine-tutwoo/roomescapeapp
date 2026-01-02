'use client';

import { Ghost, Play } from 'lucide-react';

export default function HomepageGallery({ items }) {
  if (!items || items.length === 0) {
    // Fallback: 如果 Keystatic 沒有資料，顯示 placeholder
    return (
      <>
        <div className="aspect-[4/5] bg-bg-secondary/50 rounded-[2rem] border border-accent-beige/20 flex flex-col items-center justify-center gap-3 group hover:border-accent-orange/30 transition-colors">
          <Ghost size={32} className="text-text-secondary opacity-20 group-hover:scale-110 group-hover:text-accent-orange transition-all duration-500" />
          <span className="text-xs font-bold text-text-secondary opacity-40">真實活動剪影</span>
        </div>
        <div className="aspect-[4/5] bg-bg-secondary/50 rounded-[2rem] border border-accent-beige/20 flex flex-col items-center justify-center gap-3 group hover:border-accent-orange/30 transition-colors">
          <Ghost size={32} className="text-text-secondary opacity-20 group-hover:scale-110 group-hover:text-accent-orange transition-all duration-500" />
          <span className="text-xs font-bold text-text-secondary opacity-40">玩家熱情反饋</span>
        </div>
        <div className="hidden sm:flex aspect-[4/5] bg-bg-secondary/50 rounded-[2rem] border border-accent-beige/20 flex flex-col items-center justify-center gap-3 group hover:border-accent-orange/30 transition-colors">
          <Ghost size={32} className="text-text-secondary opacity-20 group-hover:scale-110 group-hover:text-accent-orange transition-all duration-500" />
          <span className="text-xs font-bold text-text-secondary opacity-40">成團慶祝時刻</span>
        </div>
      </>
    );
  }

  return (
    <>
      {items.map((item, idx) => {
        const hasContent = !!(item.videoUrl || item.imageUrl);
        const isThirdItem = idx === 2;
        return (
          <div
            key={idx}
            className={`aspect-[4/5] bg-bg-secondary/50 rounded-[2rem] border border-accent-beige/20 overflow-hidden group hover:border-accent-orange/30 transition-colors relative ${
              isThirdItem ? 'hidden sm:flex flex-col' : 'flex flex-col'
            }`}
          >
            {hasContent ? (
              <>
                {item.videoUrl ? (
                  <div className="relative w-full h-full">
                    <video
                      src={item.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.target.play()}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Play size={24} className="text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ) : item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title || `Gallery item ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : null}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 pt-8">
                  {item.title && (
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  )}
                  {item.desc && (
                    <p className="text-[10px] text-white/80 mt-1 line-clamp-2">{item.desc}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 h-full">
                <Ghost size={32} className="text-text-secondary opacity-20 group-hover:scale-110 group-hover:text-accent-orange transition-all duration-500" />
                <span className="text-xs font-bold text-text-secondary opacity-40">
                  {item.title || `項目 ${idx + 1}`}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

