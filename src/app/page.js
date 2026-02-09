import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Instagram, MessageCircle, TrendingUp, Users, Zap, Shield, Sparkles,
  Search, Calendar, Share2, CheckCircle2, Star, Clock, MapPin
} from 'lucide-react';
import AppLayout from './components/AppLayout';
import HomepageCarousel from './components/HomepageCarousel';

export default async function LandingPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const hasShareParam = !!(
    sp.eventId ||
    sp.wishId ||
    sp.host ||
    sp.tab ||
    sp.edit
  );
  if (hasShareParam) {
    if (sp.tab === 'quiz') {
      redirect('/quiz');
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === 'string') params.append(key, v);
        });
      } else if (typeof value === 'string') {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    redirect(qs ? `/lobby?${qs}` : '/lobby');
  }

  return (
    <AppLayout>
      <div className="space-y-20 sm:space-y-32">
        {/* Hero Section - 動態有機設計 */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* 動態背景 - 多層次有機形狀 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* 大型漸層圓形 */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-accent/20 via-accent/5 to-transparent rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-tertiary/20 via-tertiary/5 to-transparent rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(255,107,53,0.1)_0%,_rgba(255,107,53,0.05)_50%,_transparent_100%)] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
            
            {/* 小型裝飾形狀 */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-32 right-20 w-24 h-24 bg-tertiary/15 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-secondary/10 rotate-45 blur-xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
            {/* 標籤 - 動態效果 */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-secondary/20 via-secondary/10 to-transparent backdrop-blur-sm border-2 border-secondary/30 mb-8 animate-pop-in group hover:scale-105 transition-transform duration-300">
              <Sparkles size={18} className="text-secondary animate-pulse" strokeWidth={2.5} />
              <span className="text-sm font-bold text-foreground uppercase tracking-wider">台灣最活躍的密室揪團平台</span>
            </div>

            {/* 主標題 - 漸層文字效果 */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-tight animate-pop-in-delay-1">
              <span className="block text-foreground mb-2">找不到人一起玩密室？</span>
              <span className="block bg-gradient-to-r from-accent via-secondary to-tertiary bg-clip-text text-transparent animate-gradient">
                小迷糊幫你快速成團！
              </span>
            </h1>

            {/* 副標題 */}
            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-pop-in-delay-2 font-medium">
              一鍵開團、智能配對、主揪審核，讓每場密室都能快速成團
              <br className="hidden sm:block" />
              不再擔心找不到隊友，專注享受解謎樂趣
            </p>

            {/* CTA 按鈕組 - 增強動效 */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-pop-in-delay-3">
              <Link
                href="/lobby"
                className="btn-primary group inline-flex items-center gap-3 px-10 py-5 text-xl relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Search size={22} className="relative z-10 group-hover:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                <span className="relative z-10">立即找團</span>
                <ArrowRight size={22} className="relative z-10 group-hover:translate-x-2 transition-transform duration-300" strokeWidth={2.5} />
              </Link>
              <Link
                href="/promotions"
                className="btn-secondary group inline-flex items-center gap-3 px-10 py-5 text-xl relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Sparkles size={22} className="relative z-10 group-hover:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                <span className="relative z-10">查看優惠</span>
              </Link>
            </div>

            {/* 關鍵數據展示 - 無框設計 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border-2 border-accent/20 group-hover:border-accent/40 transition-all duration-300 group-hover:scale-105 group-hover:-rotate-1">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
                  <div className="text-sm text-muted-foreground font-medium">已開團數</div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border-2 border-secondary/20 group-hover:border-secondary/40 transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-secondary to-secondary/70 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">200+</div>
                  <div className="text-sm text-muted-foreground font-medium">活躍玩家</div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border-2 border-tertiary/20 group-hover:border-tertiary/40 transition-all duration-300 group-hover:scale-105 group-hover:-rotate-1">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-tertiary to-tertiary/70 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">100%</div>
                  <div className="text-sm text-muted-foreground font-medium">成團率</div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-quaternary/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border-2 border-quaternary/20 group-hover:border-quaternary/40 transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-quaternary to-quaternary/70 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">24hr</div>
                  <div className="text-sm text-muted-foreground font-medium">平均成團</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 核心功能區 - 流動式設計 */}
        <section className="px-4 sm:px-6 relative">
          {/* 背景流動效果 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-tertiary/5 rounded-full blur-3xl animate-float-slow" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16 animate-pop-in">
              <h2 className="text-4xl sm:text-5xl font-bold mb-5">
                <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                  為什麼選擇小迷糊？
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                專為密室玩家設計的功能，讓揪團變得更簡單、更安全、更有趣
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 功能 1 - 不對稱設計 */}
              <div className="relative group">
                {/* 背景光暈 */}
                <div className="absolute -inset-1 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-accent/20 group-hover:border-accent/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-rotate-1">
                  {/* 裝飾形狀 */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                      <Zap size={32} className="text-accent-foreground transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors duration-300">一鍵開團</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      簡單填寫活動資訊，系統自動配對，快速找到志同道合的隊友
                    </p>
                  </div>
                </div>
              </div>

              {/* 功能 2 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-secondary/20 group-hover:border-secondary/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:rotate-1">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                      <Shield size={32} className="text-white transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-secondary transition-colors duration-300">主揪審核</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      主揪可審核報名成員，確保團隊品質，讓每場遊戲都能順利進行
                    </p>
                  </div>
                </div>
              </div>

              {/* 功能 3 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-tertiary/20 via-tertiary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-tertiary/20 group-hover:border-tertiary/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-rotate-1">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-tertiary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-tertiary to-tertiary/80 rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                      <Users size={32} className="text-foreground transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-tertiary transition-colors duration-300">智能配對</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      根據時間、地點、主題自動配對，快速找到最適合的活動
                    </p>
                  </div>
                </div>
              </div>

              {/* 功能 4 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-quaternary/20 via-quaternary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-quaternary/20 group-hover:border-quaternary/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:rotate-1">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-quaternary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-quaternary to-quaternary/80 rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                      <Calendar size={32} className="text-white transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-quaternary transition-colors duration-300">活動管理</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      完整的活動資訊、候補名單、攜伴管理，讓主揪輕鬆掌控一切
                    </p>
                  </div>
                </div>
              </div>

              {/* 功能 5 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-accent/20 group-hover:border-accent/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:-rotate-1">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                      <Share2 size={32} className="text-accent-foreground transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors duration-300">一鍵分享</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      生成專屬連結，輕鬆分享到 LINE、IG，邀請好友一起加入
                    </p>
                  </div>
                </div>
              </div>

              {/* 功能 6 */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm rounded-3xl p-8 border-2 border-secondary/20 group-hover:border-secondary/40 transition-all duration-300 group-hover:scale-[1.02] group-hover:rotate-1">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                      <Star size={32} className="text-white transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-secondary transition-colors duration-300">優惠情報</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      整合全台工作室優惠資訊，讓玩家不錯過任何好康
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 使用流程 - 流動式連接設計 */}
        <section className="px-4 sm:px-6 relative">
          {/* 流動背景 */}
          <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-transparent to-card/30" />
          
          <div className="max-w-6xl mx-auto relative z-10 py-20">
            <div className="text-center mb-16 animate-pop-in">
              <h2 className="text-4xl sm:text-5xl font-bold mb-5">
                <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                  三步驟，輕鬆成團
                </span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                簡單直覺的操作流程，讓揪團變得更輕鬆
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* 流動連接線 - SVG */}
              <div className="hidden md:block absolute top-24 left-0 right-0 h-1 z-0">
                <svg className="w-full h-full" viewBox="0 0 100 1" preserveAspectRatio="none">
                  <path
                    d="M 0 0.5 Q 25 0.5, 50 0.5 T 100 0.5"
                    stroke="url(#gradient-line)"
                    strokeWidth="2"
                    fill="none"
                    className="animate-gradient"
                  />
                  <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#FF6B35" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Step 1 */}
              <div className="relative group animate-pop-in-delay-1 z-10">
                <div className="relative">
                  {/* 光暈效果 */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative bg-gradient-to-br from-accent/10 via-accent/5 to-transparent backdrop-blur-md rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-8 border-2 border-accent/30 group-hover:border-accent/60 group-hover:scale-110 group-hover:animate-wiggle transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                    <span className="text-5xl font-bold text-accent">1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors duration-300">選擇活動</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    瀏覽揪團大廳，找到感興趣的密室主題和時間
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group animate-pop-in-delay-2 z-10">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent backdrop-blur-md rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-8 border-2 border-secondary/30 group-hover:border-secondary/60 group-hover:scale-110 group-hover:animate-wiggle transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                    <span className="text-5xl font-bold text-secondary">2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-secondary transition-colors duration-300">報名參加</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    點擊報名，填寫基本資訊，等待主揪審核
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group animate-pop-in-delay-3 z-10">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-tertiary/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative bg-gradient-to-br from-tertiary/10 via-tertiary/5 to-transparent backdrop-blur-md rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-8 border-2 border-tertiary/30 group-hover:border-tertiary/60 group-hover:scale-110 group-hover:animate-wiggle transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                    <span className="text-5xl font-bold text-tertiary">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-tertiary transition-colors duration-300">成團出發</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    審核通過後，與隊友聯繫，一起享受密室樂趣
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 社群展示區 */}
        <section className="px-4 sm:px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-pop-in">
              <h2 className="text-4xl sm:text-5xl font-bold mb-5">
                <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                  看看大家都在玩什麼
                </span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                真實的活動照片和影片，感受密室逃脫的魅力
              </p>
            </div>
            <div className="animate-pop-in-delay-1">
              <HomepageCarousel />
            </div>
          </div>
        </section>

        {/* 社群連結 - 流動式設計 */}
        <section className="px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto">
            {/* 外層流動容器 */}
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 group">
              {/* 動態漸層背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-card/80 to-tertiary/10 animate-gradient" />
              
              {/* 模糊裝飾層 */}
              <div className="absolute inset-0 backdrop-blur-sm" />
              
              {/* 動態光暈 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl animate-float-slow opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-glow opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>

              {/* 邊框效果 */}
              <div className="absolute inset-0 rounded-3xl border-2 border-accent/20 group-hover:border-accent/40 transition-colors duration-300" style={{ boxShadow: '8px 8px 0px 0px #FF8C00' }} />

              <div className="relative z-10 text-center">
                {/* 圖標 - 動態效果 */}
                <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                  <MessageCircle size={40} className="text-accent-foreground transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-5 group-hover:text-accent transition-colors duration-300">
                  加入我們的社群
                </h3>
                
                <p className="text-lg text-muted-foreground font-medium mb-10 max-w-md mx-auto leading-relaxed">
                  獲得即時開團通知、專屬優惠情報，與更多密室玩家交流
                </p>
                
                {/* 按鈕組 */}
                <div className="flex flex-col sm:flex-row gap-5 justify-center">
                  <a
                    href="https://line.me/ti/g2/04aicsfxOcNA2fRhxM1vn07e6JieIO7EqKbQZg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary group/btn inline-flex items-center justify-center gap-3 px-10 py-5 text-lg relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <MessageCircle size={22} className="relative z-10 group-hover/btn:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                    <span className="relative z-10">LINE 社群</span>
                    <ArrowRight size={22} className="relative z-10 group-hover/btn:translate-x-2 transition-transform duration-300" strokeWidth={2.5} />
                  </a>
                  <a
                    href="https://www.instagram.com/hu._escaperoom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary group/btn inline-flex items-center justify-center gap-3 px-10 py-5 text-lg relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <Instagram size={22} className="relative z-10 group-hover/btn:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                    <span className="relative z-10">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 最終 CTA - 動態設計 */}
        <section className="px-4 sm:px-6 pb-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative group">
              {/* 背景動態效果 */}
              <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 via-secondary/10 to-tertiary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-md rounded-3xl p-10 sm:p-14 border-2 border-accent/20 group-hover:border-accent/40 transition-all duration-300 group-hover:scale-[1.02]">
                {/* 裝飾元素 */}
                <div className="absolute top-6 right-6 w-16 h-16 bg-accent/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-6 left-6 w-12 h-12 bg-tertiary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent/20 via-accent/10 to-transparent backdrop-blur-sm border-2 border-accent/30 mb-8 group-hover:bg-accent/30 group-hover:border-accent/50 transition-all duration-300">
                    <CheckCircle2 size={18} className="text-accent group-hover:scale-110 group-hover:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                    <span className="text-sm font-bold text-foreground uppercase tracking-wider">準備好開始了嗎？</span>
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-bold mb-6 group-hover:text-accent transition-colors duration-300">
                    <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                      立即開始你的密室冒險
                    </span>
                  </h2>
                  <p className="text-xl text-muted-foreground mb-10 font-medium">
                    加入小迷糊，找到最適合的隊友，一起享受解謎的樂趣
                  </p>
                  <Link
                    href="/lobby"
                    className="btn-primary group/btn inline-flex items-center gap-3 px-12 py-6 text-xl relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <Search size={26} className="relative z-10 group-hover/btn:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                    <span className="relative z-10">前往揪團大廳</span>
                    <ArrowRight size={26} className="relative z-10 group-hover/btn:translate-x-2 transition-transform duration-300" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
