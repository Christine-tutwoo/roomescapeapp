'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Instagram, MessageCircle, TrendingUp,
  Ghost
} from 'lucide-react';
import AppLayout from './components/AppLayout';

export default function LandingPage() {
  const router = useRouter();

  // Backward-compat: 舊分享連結是丟到首頁 `/?eventId=...`
  // 這裡自動轉到 `/lobby?...`，避免舊連結掛掉
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const hasShareParam =
      params.has('eventId') || params.has('wishId') || params.has('host') || params.has('tab') || params.has('edit');
    if (!hasShareParam) return;

    const tab = params.get('tab');
    if (tab === 'quiz') {
      router.replace('/quiz');
      return;
    }

    router.replace(`/lobby?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFindGroup = () => {
    router.push('/lobby');
  };

  return (
    <AppLayout>
      {/* Main Content */}
      <div className="space-y-12 sm:space-y-20 animate-in fade-in duration-700">
        {/* Hero Section */}
        <section className="py-12 sm:py-24 text-center relative overflow-hidden rounded-[3rem] bg-bg-secondary/30 border border-accent-beige/20 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(72%_0.18_48_/_0.05),_transparent_70%)]" />
          <div className="relative z-10 px-6">
            <h2 className="text-fluid-h1 font-outfit text-text-primary mb-6 leading-[1.1]">
              謎題交給隊友，<br />
              <span className="text-accent-orange">揪團</span>交給我處理。
            </h2>
            <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
              一鍵開團、成員審核，<br className="sm:hidden" />讓您快速成團、安心出發。
            </p>
            <button
              onClick={handleFindGroup}
              className="btn-primary flex items-center gap-3 mx-auto text-lg shadow-xl shadow-accent-orange/20"
            >
              立即找團
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Three Steps Section */}
        <section className="px-2">
          <h3 className="text-2xl sm:text-3xl font-black font-outfit text-text-primary text-center mb-10 tracking-tight">
            三步驟輕鬆成團
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="card-premium p-8 text-center group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-orange/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
              <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-accent-orange-hover rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-orange/20 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-2xl font-outfit">1</span>
              </div>
              <h4 className="text-xl font-bold text-text-primary mb-3">發起揪團</h4>
              <p className="text-text-secondary font-medium leading-relaxed">選擇主題與時間，<br />開啟精彩冒險。</p>
            </div>

            {/* Step 2 */}
            <div className="card-premium p-8 text-center group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-orange/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
              <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-accent-orange-hover rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-orange/20 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-2xl font-outfit">2</span>
              </div>
              <h4 className="text-xl font-bold text-text-primary mb-3">一鍵分享</h4>
              <p className="text-text-secondary font-medium leading-relaxed">或是透過連結，<br />邀請好友加入。</p>
            </div>

            {/* Step 3 */}
            <div className="card-premium p-8 text-center group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-orange/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
              <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-accent-orange-hover rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-orange/20 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-2xl font-outfit">3</span>
              </div>
              <h4 className="text-xl font-bold text-text-primary mb-3">等待加入</h4>
              <p className="text-text-secondary font-medium leading-relaxed">主揪審核名單，<br />快速成團出發。</p>
            </div>
          </div>
        </section>

        {/* Community Testimonials Section */}
        <section className="px-2">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black font-outfit text-text-primary text-center mb-10 tracking-tight">
              社群口碑
            </h3>
            <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 border border-accent-beige/30 shadow-premium mb-10 relative overflow-hidden group glass-edge">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-4 bg-accent-orange/10 rounded-2xl mb-6 shadow-inner">
                  <TrendingUp size={32} className="text-accent-orange" />
                </div>
                <p className="text-lg text-text-secondary font-bold font-outfit uppercase tracking-[0.2em] mb-4">
                  從 2025/10 月創立至今
                </p>
                <div className="text-4xl sm:text-6xl font-black text-text-primary text-center tracking-tight mb-4">
                  已開超過 <span className="text-accent-orange">二十團</span>
                </div>
                <p className="text-text-secondary font-medium text-center max-w-md">
                  穩定的揪團頻率，讓小迷糊成為密室玩家首選的媒合平台。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="aspect-[4/5] bg-bg-secondary/50 rounded-[2rem] border border-accent-beige/20 flex flex-col items-center justify-center gap-3 group hover:border-accent-orange/30 transition-colors">
                <Ghost size={32} className="text-text-secondary opacity-20 group-hover:scale-110 group-hover:text-accent-orange transition-all duration-500" />
                <span className="text-xs font-bold text-text-secondary opacity-40">真實活動剪影</span>
              </div>
              <div className="aspect-[4/5] bg-bg-secondary/50 rounded-[2rem] border border-accent-beige/20 flex flex-col items-center justify-center gap-3 group hover:border-accent-orange/30 transition-colors">
                <Ghost size={32} className="text-text-secondary opacity-20 group-hover:scale-110 group-hover:text-accent-orange transition-all duration-500" />
                <span className="text-xs font-bold text-text-secondary opacity-40">玩家熱情反饋</span>
              </div>
              <div className="hidden sm:flex aspect-[4/5] bg-bg-secondary/50 rounded-[2rem] border border-accent-beige/20 flex-col items-center justify-center gap-3 group hover:border-accent-orange/30 transition-colors">
                <Ghost size={32} className="text-text-secondary opacity-20 group-hover:scale-110 group-hover:text-accent-orange transition-all duration-500" />
                <span className="text-xs font-bold text-text-secondary opacity-40">成團慶祝時刻</span>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media Section */}
        <section className="text-center py-12 sm:py-20 bg-bg-secondary/20 rounded-[3rem] border border-accent-beige/10">
          <h3 className="text-2xl sm:text-3xl font-black font-outfit text-text-primary mb-6 tracking-tight">
            追蹤我們的社群媒體
          </h3>
          <p className="text-text-secondary font-medium mb-10 max-w-sm mx-auto">
            獲得即時的開團通知與專屬的工作室優惠情報。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-6">
            <a
              href="https://liff.line.me/1645278921-kWRPP32q/?accountId=hu._escaperoom"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center gap-3 px-8 text-lg"
            >
              <MessageCircle size={22} />
              LINE社群
            </a>
            <a
              href="https://www.instagram.com/hu._escaperoom"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center gap-3 px-8 text-lg"
            >
              <Instagram size={22} />
              Instagram
            </a>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="text-center pb-12">
          <div className="inline-block p-1 rounded-full bg-accent-orange/10 mb-6">
            <div className="px-4 py-1 rounded-full bg-white text-accent-orange text-[10px] font-black font-outfit uppercase tracking-widest">
              Ready to Play?
            </div>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black font-outfit text-text-primary mb-6 tracking-tight">
            冒險，就從現在開始。
          </h3>
          <p className="text-text-secondary font-medium mb-10">
            趕快來看看有沒有你感興趣的密室逃脫主題吧！
          </p>
          <button
            onClick={handleFindGroup}
            className="btn-primary group flex items-center gap-3 mx-auto px-10 py-4 text-xl shadow-xl shadow-accent-orange/20"
          >
            立即找團
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </section>
      </div>
    </AppLayout>
  );
}
