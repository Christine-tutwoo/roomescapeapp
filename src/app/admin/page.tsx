'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader, Lock } from 'lucide-react';
import Link from 'next/link';

// Admin 認證已移到服務端，不再在前端暴露

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // 檢查服務端認證狀態
    fetch('/api/admin/login')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // 忽略錯誤
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setError(data.error || '帳號或密碼錯誤');
      }
    } catch (error: any) {
      setError('登入失敗，請稍後再試');
    }
  };

  const handleLogout = async () => {
    try {
      // 清除 cookie（需要服務端 API）
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // 忽略錯誤
    }
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setResult(null);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: '發布成功！所有用戶下次訪問時會檢查版本時間並自動更新。',
        });
      } else {
        setResult({
          success: false,
          message: data.error || '發布失敗',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || '發布時發生錯誤',
      });
    } finally {
      setPublishing(false);
    }
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-[#EBE3D7] shadow-xl p-8 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#212121] mb-2">管理後台</h1>
            <p className="text-[#7A7A7A]">發布更新</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#F7F4EF] hover:bg-[#EFE7DB] rounded-xl text-[#7A7A7A] transition-colors"
          >
            登出
          </button>
        </div>

        {/* 發布更新區塊 */}
        <div className="bg-white rounded-2xl border border-[#EBE3D7] shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-[#212121] mb-4">發布更新</h2>
          <p className="text-[#7A7A7A] mb-6">
            發布更新後，所有用戶下次訪問時會檢查版本時間，如果他們的快取時間早於最新版本，會自動更新。
          </p>

          {result && (
            <div
              className={`mb-6 p-4 rounded-xl border ${
                result.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                <p>{result.message}</p>
              </div>
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              publishing
                ? 'bg-[#C1B7AA] cursor-not-allowed'
                : 'bg-[#FF8C00] text-white hover:opacity-90'
            }`}
          >
            {publishing ? (
              <>
                <Loader className="animate-spin" size={20} />
                發布中...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                發布更新
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-[#7A7A7A] hover:text-[#212121] transition"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
