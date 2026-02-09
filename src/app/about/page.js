'use client';

import { useState } from 'react';
import { ExternalLink, Heart, Code, Users, Shield, Sparkles, Mail, Instagram } from 'lucide-react';

export default function AboutPage() {
  const [showSponsorModal, setShowSponsorModal] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-24">
        <div className="py-6 md:py-10 space-y-16 sm:space-y-24">
          {/* Hero Section */}
          <section className="relative">
            {/* 動態背景 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-tertiary/20 via-tertiary/5 to-transparent rounded-full blur-3xl animate-float-slow" />
            </div>

            <div className="relative z-10 text-center animate-pop-in">
              {/* Logo */}
              <div className="relative inline-block mb-8 group">
                <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-card rounded-full p-4 border-2 border-foreground group-hover:scale-110 group-hover:animate-wiggle transition-all duration-300" style={{ boxShadow: '8px 8px 0px 0px #1E293B' }}>
                  <img
                    src="/logo.png"
                    alt="小迷糊密室揪團平台 Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>

              {/* 主標題 */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                  小迷糊密室揪團平台
                </span>
              </h1>

              {/* 副標題 */}
              <div className="space-y-3 mb-8 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent/20 via-accent/10 to-transparent backdrop-blur-sm border-2 border-accent/30">
                  <Sparkles size={18} className="text-accent" strokeWidth={2.5} />
                  <span className="text-sm font-bold text-foreground">快速找隊友揪團：即時招募、名額與候補管理</span>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-secondary/20 via-secondary/10 to-transparent backdrop-blur-sm border-2 border-secondary/30">
                  <Users size={18} className="text-secondary" strokeWidth={2.5} />
                  <span className="text-sm font-bold text-foreground">密室玩家人格測驗：找到更合拍的解謎搭檔</span>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent backdrop-blur-sm border-2 border-tertiary/30">
                  <Shield size={18} className="text-tertiary" strokeWidth={2.5} />
                  <span className="text-sm font-bold text-foreground">活動管理與優惠情報：揪團更輕鬆、出發更安心</span>
                </div>
              </div>

              {/* 版本號 */}
              <p className="text-muted-foreground font-medium">v1.0.0</p>
            </div>
          </section>

          {/* 團隊成員區塊 */}
          <section className="space-y-8">
            {/* Founder */}
            <div className="relative group animate-pop-in-delay-1">
              <div className="absolute -inset-1 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative card-premium p-8 sm:p-10 text-center">
                {/* 裝飾元素 */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                    <Heart size={32} className="text-accent-foreground" strokeWidth={2.5} />
                  </div>
                  
                  <h3 className="text-accent font-bold text-lg mb-2 uppercase tracking-wider">Founder</h3>
                  <div className="text-3xl font-bold text-foreground mb-6">小迷糊</div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setShowSponsorModal(true)}
                      className="btn-primary group/btn inline-flex items-center justify-center gap-2 px-6 py-3 relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      <Heart size={18} className="relative z-10 group-hover/btn:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                      <span className="relative z-10">贊助小迷糊</span>
                    </button>
                    <a
                      href="https://www.instagram.com/hu._escaperoom/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary group/btn inline-flex items-center justify-center gap-2 px-6 py-3 relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      <Instagram size={18} className="relative z-10 group-hover/btn:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                      <span className="relative z-10">聯繫小迷糊</span>
                      <ExternalLink size={16} className="relative z-10" strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Engineer */}
            <div className="relative group animate-pop-in-delay-2">
              <div className="absolute -inset-1 bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative card-premium p-8 sm:p-10 text-center">
                <div className="absolute top-4 right-4 w-20 h-20 bg-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                    <Code size={32} className="text-white" strokeWidth={2.5} />
                  </div>
                  
                  <h3 className="text-secondary font-bold text-lg mb-2 uppercase tracking-wider">用愛發電工程師</h3>
                  <div className="text-3xl font-bold text-foreground mb-2">曠</div>
                  <div className="text-muted-foreground font-medium mb-3">運營小工作室 NextEdge AI Studio</div>
                  <p className="text-sm text-muted-foreground mb-6 italic">
                    "有需要做網頁可以找你！報小迷糊名字有折扣"
                  </p>
                  
                  <a
                    href="https://nextedge-ai-studio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary group/btn inline-flex items-center justify-center gap-2 px-6 py-3 relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <Code size={18} className="relative z-10 group-hover/btn:animate-wiggle transition-transform duration-300" strokeWidth={2.5} />
                    <span className="relative z-10">NextEdge AI Studio 官網</span>
                    <ExternalLink size={16} className="relative z-10" strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </div>

            {/* Co-Maintainer */}
            <div className="relative group animate-pop-in-delay-3">
              <div className="absolute -inset-1 bg-gradient-to-br from-tertiary/20 via-tertiary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative card-premium p-8 sm:p-10 text-center">
                <div className="absolute top-4 right-4 w-20 h-20 bg-tertiary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-tertiary to-tertiary/80 rounded-2xl mb-6 border-2 border-foreground group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                    <Users size={32} className="text-foreground" strokeWidth={2.5} />
                  </div>
                  
                  <h3 className="text-tertiary font-bold text-lg mb-4 uppercase tracking-wider">協作者 / 維運</h3>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-tertiary/20 to-tertiary/10 rounded-full flex items-center justify-center border-2 border-foreground text-2xl" style={{ boxShadow: '2px 2px 0px 0px #1E293B' }}>
                      👻
                    </div>
                    <div className="text-3xl font-bold text-foreground">飄</div>
                  </div>
                  <div className="text-muted-foreground font-medium space-y-1">
                    <div>我是飄，負責維運。</div>
                    <div>偶爾幫忙修修 bug。</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setShowSponsorModal(false)}
        >
          <div 
            className="card-premium p-8 max-w-md w-full relative group" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 動態背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-card/80 to-tertiary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center border-2 border-foreground" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                  <Heart size={24} className="text-accent-foreground" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">贊助小迷糊</h3>
              </div>
              
              <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
                感謝您對小迷糊的支持！您的贊助將幫助平台持續運營與改進。
              </p>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm font-bold text-foreground">贊助方式：</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border-2 border-foreground/10">
                    <Instagram size={18} className="text-secondary shrink-0" strokeWidth={2.5} />
                    <p className="text-sm text-muted-foreground font-medium">透過 Instagram 私訊聯繫</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border-2 border-foreground/10">
                    <Mail size={18} className="text-accent shrink-0" strokeWidth={2.5} />
                    <p className="text-sm text-muted-foreground font-medium">或寄信至 xiaomihuu0921@gmail.com</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowSponsorModal(false)}
                className="btn-primary w-full group/btn inline-flex items-center justify-center gap-2 py-4 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">關閉</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
