import React from 'react';
import { Shield, Instagram } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFE4B5] border border-[#EBE3D7] flex items-center justify-center">
              <Shield className="text-[#212121]" size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#212121]">隱私權政策</h1>
              <p className="text-sm text-[#7A7A7A]">Privacy Policy</p>
            </div>
          </div>
          <div className="text-xs text-[#7A7A7A]">
            最後更新日期：2025/12/02
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBE3D7] shadow-sm mb-6">
          <p className="text-sm sm:text-base text-[#212121] leading-relaxed">
            小迷糊密室揪團平台（以下稱「本服務」、「我們」）非常重視會員的個人隱私。
            為了讓您了解我們如何蒐集、使用及保護您所提供的個人資料，請詳閱以下隱私權政策。
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBE3D7] shadow-sm">
          <div className="space-y-8 text-sm sm:text-base text-[#212121] leading-relaxed">

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">1</span>
                個人資料的蒐集
              </h2>
              <p className="text-[#7A7A7A] mb-3">
                當您使用 Google 帳號登入本服務時，我們會取得以下資料：
              </p>
              <ul className="list-disc list-inside text-[#7A7A7A] space-y-1.5 ml-2">
                <li>Google 帳號顯示名稱</li>
                <li>Google 帳號電子郵件</li>
                <li>Google 帳號頭像圖片網址</li>
                <li>Google 帳號唯一識別碼 (UID)</li>
              </ul>
              <p className="text-[#7A7A7A] mt-4 mb-3">
                當您使用本服務時，我們可能會蒐集：
              </p>
              <ul className="list-disc list-inside text-[#7A7A7A] space-y-1.5 ml-2">
                <li>您設定的社群暱稱</li>
                <li>您發起或參加的揪團活動資訊</li>
                <li>您的許願池資料</li>
                <li>瀏覽器類型、裝置資訊、IP 位址等技術資料</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">2</span>
                個人資料的使用
              </h2>
              <p className="text-[#7A7A7A] mb-3">
                我們蒐集的個人資料將用於以下目的：
              </p>
              <ul className="list-disc list-inside text-[#7A7A7A] space-y-1.5 ml-2">
                <li>提供揪團媒合服務</li>
                <li>讓主揪與參加者能夠互相聯繫</li>
                <li>改善服務品質與使用者體驗</li>
                <li>統計分析（不會識別個人身份）</li>
                <li>防止濫用與維護平台安全</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">3</span>
                個人資料的分享
              </h2>
              <p className="text-[#7A7A7A] mb-3">
                我們不會將您的個人資料出售給第三方。您的資料僅在以下情況下可能被分享：
              </p>
              <ul className="list-disc list-inside text-[#7A7A7A] space-y-1.5 ml-2">
                <li>您同意的情況下</li>
                <li>揪團活動中，主揪可看到參加者的暱稱</li>
                <li>法律要求或政府機關依法調閱</li>
                <li>保護本服務或其他使用者的權益</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">4</span>
                資料儲存與安全
              </h2>
              <p className="text-[#7A7A7A]">
                您的資料儲存於 Google Firebase 雲端服務，我們採取適當的安全措施保護您的個人資料，
                包括加密傳輸、存取控制等。然而，網路傳輸無法保證 100% 安全，請您妥善保管帳號資訊。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">5</span>
                Cookie 的使用
              </h2>
              <p className="text-[#7A7A7A]">
                本服務使用 Cookie 來維持您的登入狀態及改善使用體驗。
                您可以在瀏覽器設定中選擇停用 Cookie，但這可能會影響部分功能的使用。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">6</span>
                您的權利
              </h2>
              <p className="text-[#7A7A7A] mb-3">
                根據個人資料保護相關法規，您享有以下權利：
              </p>
              <ul className="list-disc list-inside text-[#7A7A7A] space-y-1.5 ml-2">
                <li>查詢或請求閱覽您的個人資料</li>
                <li>請求製給複本</li>
                <li>請求補充或更正</li>
                <li>請求停止蒐集、處理或利用</li>
                <li>請求刪除您的個人資料</li>
              </ul>
              <p className="text-[#7A7A7A] mt-3">
                如需行使上述權利，請透過小迷糊 Instagram 聯繫我們。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">7</span>
                隱私權政策的修訂
              </h2>
              <p className="text-[#7A7A7A]">
                我們保留隨時修訂本隱私權政策的權利。修訂後的條款將公布於本頁面，
                並自公布日起生效。建議您定期查閱本政策以了解最新內容。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#FFE4B5] rounded-full flex items-center justify-center text-xs font-bold border border-[#EBE3D7]">8</span>
                聯絡我們
              </h2>
              <p className="text-[#7A7A7A] mb-4">
                如果您對本隱私權政策有任何疑問，請透過以下方式聯繫：
              </p>
              <a
                href="https://www.instagram.com/hu._escaperoom/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFE4B5] text-[#212121] rounded-xl text-sm font-bold hover:bg-[#FFD700] transition-colors border border-[#D1C7BB]"
              >
                <Instagram size={16} />
                小迷糊 Instagram
              </a>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
