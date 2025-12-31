'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, X } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-[#EBE3D7] shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF8C00] to-[#FFA500] p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">優惠管理後台</h1>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <iframe
              src="/keystatic"
              className="w-full h-[calc(100vh-250px)] min-h-[600px] border border-[#EBE3D7] rounded-xl"
              title="Keystatic Admin"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


