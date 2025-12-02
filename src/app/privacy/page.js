'use client';

import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-white mb-2">隱私權政策</h1>
          <p className="text-slate-400 text-sm">Privacy Policy</p>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <p className="text-slate-500 text-xs mb-6">最後更新日期：2025/01/01</p>

          <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
            
            <p>
              小迷糊密室逃脫揪團平台（以下稱「本服務」、「我們」）非常重視會員的個人隱私。
              為了讓您了解我們如何蒐集、使用及保護您所提供的個人資料，請詳閱以下隱私權政策。
            </p>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">1</span>
                個人資料的蒐集
              </h2>
              <p className="text-slate-400 mb-3">
                當您使用 Google 帳號登入本服務時，我們會取得以下資料：
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>Google 帳號顯示名稱</li>
                <li>Google 帳號電子郵件</li>
                <li>Google 帳號頭像圖片網址</li>
                <li>Google 帳號唯一識別碼 (UID)</li>
              </ul>
              <p className="text-slate-400 mt-4 mb-3">
                當您使用本服務時，我們可能會蒐集：
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>您設定的社群暱稱</li>
                <li>您發起或參加的揪團活動資訊</li>
                <li>您的許願池資料</li>
                <li>瀏覽器類型、裝置資訊、IP 位址等技術資料</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">2</span>
                個人資料的使用
              </h2>
              <p className="text-slate-400 mb-3">
                我們蒐集的個人資料將用於以下目的：
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>提供揪團媒合服務</li>
                <li>讓主揪與參加者能夠互相聯繫</li>
                <li>改善服務品質與使用者體驗</li>
                <li>統計分析（不會識別個人身份）</li>
                <li>防止濫用與維護平台安全</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">3</span>
                個人資料的分享
              </h2>
              <p className="text-slate-400 mb-3">
                我們不會將您的個人資料出售給第三方。您的資料僅在以下情況下可能被分享：
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>您同意的情況下</li>
                <li>揪團活動中，主揪可看到參加者的暱稱</li>
                <li>法律要求或政府機關依法調閱</li>
                <li>保護本服務或其他使用者的權益</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">4</span>
                資料儲存與安全
              </h2>
              <p className="text-slate-400">
                您的資料儲存於 Google Firebase 雲端服務，我們採取適當的安全措施保護您的個人資料，
                包括加密傳輸、存取控制等。然而，網路傳輸無法保證 100% 安全，請您妥善保管帳號資訊。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">5</span>
                Cookie 的使用
              </h2>
              <p className="text-slate-400">
                本服務使用 Cookie 來維持您的登入狀態及改善使用體驗。
                您可以在瀏覽器設定中選擇停用 Cookie，但這可能會影響部分功能的使用。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">6</span>
                您的權利
              </h2>
              <p className="text-slate-400 mb-3">
                根據個人資料保護相關法規，您享有以下權利：
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1.5 ml-2">
                <li>查詢或請求閱覽您的個人資料</li>
                <li>請求製給複本</li>
                <li>請求補充或更正</li>
                <li>請求停止蒐集、處理或利用</li>
                <li>請求刪除您的個人資料</li>
              </ul>
              <p className="text-slate-400 mt-3">
                如需行使上述權利，請透過小迷糊 Instagram 聯繫我們。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">7</span>
                兒童隱私
              </h2>
              <p className="text-slate-400">
                本服務不針對 13 歲以下兒童提供服務。如果我們發現不慎蒐集了兒童的個人資料，
                將會立即刪除相關資料。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">8</span>
                隱私權政策的修訂
              </h2>
              <p className="text-slate-400">
                我們保留隨時修訂本隱私權政策的權利。修訂後的條款將公布於本頁面，
                並自公布日起生效。建議您定期查閱本政策以了解最新內容。
              </p>
            </section>

            <section>
              <h2 className="text-lg text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">9</span>
                聯絡我們
              </h2>
              <p className="text-slate-400 mb-4">
                如果您對本隱私權政策有任何疑問，請透過以下方式聯繫：
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
            <Link href="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors">
              使用條款
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

