'use client';

import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto p-4 py-8">
        
        {/* 返回按鈕 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>返回首頁</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="小迷糊密室逃脫揪團平台 Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">使用條款</h1>
          <p className="text-slate-400 text-sm">Terms of Service</p>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <p className="text-slate-500 text-xs mb-6">最後更新日期：2025/01/01</p>

          <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
            
            <p>
              歡迎使用小迷糊密室逃脫揪團平台（以下稱「本服務」）。
              使用本服務前，請詳閱以下使用條款。當您使用本服務時，即表示您同意遵守本條款。
            </p>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">1</span>
                服務說明
              </h2>
              <p className="text-slate-400">
                本平台提供密室逃脫愛好者一個揪團媒合的平台，讓使用者可以發起揪團活動或參加他人發起的活動。
                本服務僅提供資訊交流與媒合功能，不介入實際活動的進行、交易或糾紛處理。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">2</span>
                帳號註冊與使用
              </h2>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>您必須使用 Google 帳號登入本服務</li>
                <li>您應確保提供的資訊真實、準確</li>
                <li>您應妥善保管帳號，並對帳號下的所有行為負責</li>
                <li>禁止將帳號借予他人使用或轉讓</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">3</span>
                使用規範
              </h2>
              <p className="text-slate-400 mb-3">使用本服務時，您同意：</p>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>保持友善、尊重的態度與其他使用者交流</li>
                <li>不發布虛假、誤導性的揪團資訊</li>
                <li>不進行騷擾、詐騙或發表不當言論</li>
                <li>參加活動請準時出席，若無法參加請提前告知主揪</li>
                <li>不利用本服務進行任何違法活動</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">4</span>
                跳車機制
              </h2>
              <p className="text-slate-400">
                為維護平台秩序，本服務設有「跳車」記錄機制。若您報名後無故缺席或臨時取消，
                將累計跳車次數。跳車次數過多可能影響您使用本服務的權限。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">5</span>
                免責聲明
              </h2>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>本平台不對揪團活動的實際進行負責</li>
                <li>使用者間的交易、糾紛由當事人自行處理</li>
                <li>參加活動的安全風險請自行評估</li>
                <li>本平台不對密室逃脫工作室的服務品質負責</li>
                <li>因不可抗力導致的服務中斷，本平台不負賠償責任</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">6</span>
                智慧財產權
              </h2>
              <p className="text-slate-400">
                本服務的所有內容，包括但不限於文字、圖片、標誌、介面設計等，
                均受智慧財產權法保護。未經授權，不得擅自複製、修改或散布。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">7</span>
                帳號停用與終止
              </h2>
              <p className="text-slate-400">
                若您違反本使用條款，本平台有權暫停或終止您的帳號，並移除違規內容，
                且無需事先通知。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">8</span>
                條款修訂
              </h2>
              <p className="text-slate-400">
                我們保留隨時修訂本使用條款的權利。修訂後的條款將公布於本頁面，
                並自公布日起生效。繼續使用本服務即表示您同意修訂後的條款。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">9</span>
                聯絡我們
              </h2>
              <p className="text-slate-400 mb-4">
                如果您對本使用條款有任何疑問，請透過以下方式聯繫：
              </p>
              <a 
                href="mailto:xiaomihuu0921@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-xl text-sm font-bold hover:from-emerald-500/30 hover:to-teal-500/30 transition-colors border border-emerald-500/30"
              >
                📧 xiaomihuu0921@gmail.com
              </a>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/" className="text-slate-400 hover:text-emerald-400 transition-colors">
              首頁
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/privacy" className="text-slate-400 hover:text-emerald-400 transition-colors">
              隱私權政策
            </Link>
          </div>
          <p className="text-slate-500 text-xs">
            小迷糊密室逃脫揪團平台
          </p>
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} NextEdge AI Studio. All Rights Reserved.
          </p>
        </div>

      </div>
    </div>
  );
}

