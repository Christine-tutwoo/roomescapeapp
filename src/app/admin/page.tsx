'use client';

import { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  useEffect(() => {
    // 檢查是否已經登入
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      setError('帳號或密碼錯誤');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setUsername('');
    setPassword('');
  };

  const homepageSheetUrl = process.env.NEXT_PUBLIC_GS_HOME_SHEET_URL || '';
  const promoSheetUrl = process.env.NEXT_PUBLIC_GS_PROMO_SHEET_URL || '';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-8 border border-[#EBE3D7] shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#FF8C00]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FF8C00]/30">
              <Lock size={32} className="text-[#FF8C00]" />
            </div>
            <h1 className="text-2xl font-bold text-[#212121] mb-2">管理後台</h1>
            <p className="text-sm text-[#7A7A7A]">請輸入管理員帳號密碼</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">
                帳號
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-[#D1C7BB] rounded-xl px-4 py-3 text-[#212121] focus:border-[#FF8C00] outline-none"
                placeholder="請輸入帳號"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#D1C7BB] rounded-xl px-4 py-3 text-[#212121] focus:border-[#FF8C00] outline-none"
                placeholder="請輸入密碼"
                required
              />
            </div>

            {error && (
              <div className="bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-xl p-3 text-sm text-[#E74C3C]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#212121] text-white font-bold hover:opacity-90 transition-all"
            >
              登入
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tools = [
    {
      title: '首頁輪播內容',
      description: '更新圖片或 YouTube 連結，將自動同步到首頁輪播。',
      href: homepageSheetUrl,
      placeholder: '尚未設定 Google Sheet 連結',
    },
    {
      title: '優惠資訊',
      description: '管理優惠順序、標題、內容與圖片顯示。',
      href: promoSheetUrl,
      placeholder: '尚未設定 Google Sheet 連結',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="bg-white rounded-2xl border border-[#EBE3D7] shadow-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.5em] text-[#C1B7AA]">Admin</p>
            <h1 className="text-2xl font-bold text-[#212121] mt-2">內容管理面板</h1>
            <p className="text-[#7A7A7A] mt-1">透過 Google Sheet 管理首頁輪播與優惠資訊。</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-[#F7F4EF] hover:bg-[#EFE7DB] rounded-full text-[#7A7A7A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div key={tool.title} className="bg-white rounded-2xl border border-[#EBE3D7] p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#212121]">{tool.title}</h2>
              <p className="text-sm text-[#7A7A7A] mt-2 mb-4">{tool.description}</p>
              {tool.href ? (
                <a
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-[#212121] text-white font-semibold hover:opacity-90 transition"
                >
                  開啟 Google Sheet
                </a>
              ) : (
                <div className="text-xs text-[#C75C00] bg-[#FFF4E6] border border-[#FFE1BD] rounded-xl px-4 py-2 text-center">
                  {tool.placeholder}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


