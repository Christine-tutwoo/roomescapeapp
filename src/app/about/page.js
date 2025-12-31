'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export default function AboutPage() {
  const [showSponsorModal, setShowSponsorModal] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-[#212121] font-sans">
      <main className="max-w-7xl mx-auto py-4">
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center py-8">
            <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="小迷糊密室揪團平台 Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#212121] mb-2">小迷糊密室揪團平台</h1>
            <div className="mt-4 space-y-2">
              <h2 className="text-sm font-bold text-[#212121]">
                快速找隊友揪團：即時招募、名額與候補管理
              </h2>
              <h2 className="text-sm font-bold text-[#212121]">
                密室玩家人格測驗：找到更合拍的解謎搭檔
              </h2>
              <h2 className="text-sm font-bold text-[#212121]">
                活動管理與優惠情報：揪團更輕鬆、出發更安心
              </h2>
            </div>
            <p className="text-[#7A7A7A]">v1.0.0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#EBE3D7] space-y-6">
            {/* Founder */}
            <div className="text-center">
              <h3 className="text-[#FF8C00] font-bold mb-1">Founder</h3>
              <div className="text-xl font-bold text-[#212121] mb-3">小迷糊</div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowSponsorModal(true)}
                  className="px-4 py-2 bg-[#FFE4B5] text-[#212121] rounded-xl text-sm font-bold hover:bg-[#FFD700] transition-colors border border-[#D1C7BB]"
                >
                  贊助小迷糊
                </button>
                <a
                  href="https://www.instagram.com/hu._escaperoom/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold hover:bg-[#D1C7BB] transition-colors flex items-center gap-2 border border-[#D1C7BB]"
                >
                  聯繫小迷糊
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="h-px bg-[#EBE3D7] w-full" />

            {/* Engineer */}
            <div className="text-center">
              <h3 className="text-[#FF8C00] font-bold mb-1">用愛發電工程師</h3>
              <div className="text-xl font-bold text-[#212121] mb-1">曠</div>
              <div className="text-sm text-[#7A7A7A] mb-2">運營小工作室 NextEdge AI Studio</div>
              <p className="text-xs text-[#7A7A7A] mb-3">
                "有需要做網頁可以找你！報小迷糊名字有折扣"
              </p>
              <a
                href="https://nextedge-ai-studio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold hover:bg-[#D1C7BB] transition-colors inline-flex items-center gap-2 border border-[#D1C7BB]"
              >
                NextEdge AI Studio 官網
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="h-px bg-[#EBE3D7] w-full" />

            {/* Co-Maintainer */}
            <div className="text-center">
              <h3 className="text-[#FF8C00] font-bold mb-1">協作者 / 維運</h3>
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-10 h-10 bg-[#EBE3D7] rounded-full flex items-center justify-center border border-[#D1C7BB]">
                  <span className="text-xl">👻</span>
                </div>
                <div className="text-xl font-bold text-[#212121]">飄</div>
              </div>
              <div className="text-sm text-[#7A7A7A]">我是飄，負責維運。</div>
              <div className="text-sm text-[#7A7A7A]">偶爾幫忙修修 bug。</div>
            </div>

            <div className="h-px bg-[#EBE3D7] w-full" />

            {/* Terms */}
            <div>
              <h3 className="text-[#7A7A7A] font-bold mb-3 text-center">[ 使用條款 ]</h3>
              <div className="text-xs text-[#7A7A7A] space-y-2 leading-relaxed bg-[#F7F4EF] p-4 rounded-xl border border-[#EBE3D7]">
                <p>1. 本平台僅提供資訊交流與媒合，不介入實際交易與糾紛處理。</p>
                <p>2. 請使用者保持友善交流，禁止騷擾、詐騙或發表不當言論。</p>
                <p>3. 參加活動請準時出席，若無法參加請提前告知主揪。</p>
                <p>4. 平台有權移除違規內容或停用違規帳號。</p>
                <p>5. 相關活動風險請自行評估，本平台不負連帶責任。</p>
              </div>
            </div>

            <div className="h-px bg-[#EBE3D7] w-full" />

            {/* Legal Links */}
            <div className="flex justify-center gap-6">
              <a
                href="/terms"
                className="text-[#FF8C00] hover:text-[#FFA500] text-sm font-medium underline underline-offset-4"
              >
                使用條款
              </a>
              <a
                href="/privacy"
                className="text-[#FF8C00] hover:text-[#FFA500] text-sm font-medium underline underline-offset-4"
              >
                隱私權政策
              </a>
            </div>
          </div>

          <div className="text-center pb-8">
            <p className="text-[#7A7A7A] text-xs">
              © {new Date().getFullYear()} NextEdge AI Studio. All Rights Reserved.
            </p>
          </div>
        </div>
      </main>

      {/* Footer is handled by AppLayout */}

      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSponsorModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#EBE3D7]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#212121] mb-4">贊助小迷糊</h3>
            <p className="text-sm text-[#7A7A7A] mb-4">
              感謝您對小迷糊的支持！您的贊助將幫助平台持續運營與改進。
            </p>
            <div className="space-y-2 mb-4">
              <p className="text-sm font-bold text-[#212121]">贊助方式：</p>
              <p className="text-sm text-[#7A7A7A]">• 透過 Instagram 私訊聯繫</p>
              <p className="text-sm text-[#7A7A7A]">• 或寄信至 xiaomihuu0921@gmail.com</p>
            </div>
            <button
              onClick={() => setShowSponsorModal(false)}
              className="w-full py-2 bg-[#FF8C00] text-white rounded-lg font-bold hover:bg-[#FFA500] transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


