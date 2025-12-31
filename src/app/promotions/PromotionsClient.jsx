'use client';

import { useMemo, useState } from 'react';
import { MapPin, Clock, Ticket, DollarSign, Ghost, ExternalLink, Tag, Users, X, ArrowUpRight } from 'lucide-react';

function getIcon(icon) {
  switch (icon) {
    case 'dollar':
      return <DollarSign className="text-white" />;
    case 'ghost':
      return <Ghost className="text-white" />;
    case 'external':
      return <ExternalLink className="text-white" />;
    case 'tag':
      return <Tag className="text-white" />;
    case 'clock':
      return <Clock className="text-white" />;
    case 'users':
      return <Users className="text-white" />;
    case 'ticket':
    default:
      return <Ticket className="text-white" />;
  }
}

export default function PromotionsClient({ promotions }) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState('');

  const sorted = useMemo(() => {
    const list = Array.isArray(promotions) ? promotions.slice() : [];
    list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    return list;
  }, [promotions]);

  return (
    <div className="min-h-screen bg-transparent text-[#212121] font-sans">
      <main className="max-w-7xl mx-auto py-4">
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#212121] mb-1">工作室優惠情報</h2>
            <p className="text-[#7A7A7A] text-sm">蒐集全台密室優惠，玩得省錢又開心</p>
          </div>

          <div className="grid gap-4">
            {sorted.length === 0 ? (
              <div className="text-center py-10 text-[#7A7A7A] bg-white/50 rounded-3xl border border-[#EBE3D7] border-dashed">
                目前尚無優惠情報
              </div>
            ) : (
              sorted.map((promo) => (
                <div
                  key={promo.slug || `${promo.id}-${promo.title}`}
                  className="bg-white rounded-2xl overflow-hidden border border-[#EBE3D7] shadow-lg group hover:border-[#D1C7BB] transition-all relative"
                >
                  {/* Background Gradient */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${promo.color}`}></div>

                  <div className="p-5 pl-7">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-[#7A7A7A] mb-1 block flex items-center gap-1">
                          <MapPin size={12} /> {promo.studio}
                        </span>
                        <h3 className="text-lg font-bold text-[#212121] group-hover:text-[#FF8C00] transition-colors truncate">
                          {promo.title}
                        </h3>
                      </div>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${promo.color} flex items-center justify-center shadow-lg shrink-0`}>
                        {getIcon(promo.icon)}
                      </div>
                    </div>

                    <p className="text-[#7A7A7A] text-sm mb-4 leading-relaxed whitespace-pre-line">
                      {promo.content}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-[#EBE3D7] gap-3">
                      <div className="text-xs text-[#7A7A7A] flex items-center shrink-0">
                        <Clock size={12} className="mr-1" />
                        {promo.period}
                      </div>

                      <div className="flex items-center gap-2">
                        {!!promo.detailLink && (
                          <a
                            href={promo.detailLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-white hover:bg-[#EBE3D7] text-[#212121] px-3 py-1.5 rounded-lg border border-[#D1C7BB] transition-colors inline-flex items-center gap-1"
                          >
                            前往連結 <ArrowUpRight size={12} />
                          </a>
                        )}

                        {!!promo.detailImageUrl && (
                          <button
                            onClick={() => {
                              setImageModalUrl(promo.detailImageUrl);
                              setShowImageModal(true);
                            }}
                            className="text-xs bg-[#FFE4B5] hover:bg-[#FFD700] text-[#212121] px-3 py-1.5 rounded-lg border border-[#D1C7BB] transition-colors"
                          >
                            查看詳情
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 bg-[#EBE3D7] rounded-xl p-6 text-center border border-[#D1C7BB] border-dashed">
            <p className="text-[#7A7A7A] text-sm">
              你是工作室老闆嗎？
              <br />
              想要在這裡曝光優惠資訊？
            </p>
            <a
              href="https://www.instagram.com/hu._escaperoom/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-[#FF8C00] text-sm font-bold hover:underline inline-block"
            >
              聯繫我們刊登 (Instagram)
            </a>
            <div className="mt-2 text-xs text-[#7A7A7A]">或寄信至 xiaomihuu0921@gmail.com</div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowImageModal(false)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 rounded-full bg-[#EBE3D7]/60 hover:bg-[#EBE3D7] text-[#7A7A7A] hover:text-[#212121] transition-colors"
                aria-label="關閉"
              >
                <X size={18} />
              </button>
            </div>
            <img src={imageModalUrl} alt="優惠詳情" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}


