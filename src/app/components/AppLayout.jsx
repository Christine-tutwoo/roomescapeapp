'use client';

import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { Menu, X, ArrowRight, Ticket, User, Info, Home, LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Footer from './Footer';

const VISITOR_USER = {
  uid: 'visitor',
  displayName: '訪客',
  email: null,
  photoURL: null,
  isVisitor: true,
  flakeCount: 0
};

export default function AppLayout({ children }) {
  const [user, setUser] = useState(VISITOR_USER);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [inWebView, setInWebView] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isInWebView = /Line|FBAN|FBAV|Instagram|wv/i.test(navigator.userAgent);
    setInWebView(isInWebView);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || '使用者',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isVisitor: false,
          flakeCount: 0
        });
      } else {
        setUser(VISITOR_USER);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowMobileMenu(false);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowMobileMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (inWebView) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col items-center justify-center p-8 text-center">
        <div className="card-premium p-10 max-w-md w-full relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-orange/10 to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-accent-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pulse shadow-inner">
              <span className="text-5xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-black font-outfit text-text-primary mb-4 tracking-tight">請使用瀏覽器開啟</h1>
            <p className="text-text-secondary mb-8 leading-relaxed font-medium">
              為了確保帳戶安全，Google 限制在應用程式內智慧瀏覽器中進行登入。
            </p>
            <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 text-sm text-text-primary text-left border border-accent-beige/20 shadow-inner">
              <p className="font-bold text-accent-orange mb-3 uppercase tracking-wider text-[10px]">操作指南</p>
              <ol className="list-decimal list-inside space-y-3 font-bold opacity-80 decoration-accent-orange">
                <li>點擊右上角的選單圖示 ( ⋮ )</li>
                <li>選擇「在瀏覽器開啟」</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary font-inter selection:bg-accent-orange/10 noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-xl border-b border-accent-beige/20">
        <div className="px-4 py-3 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#FF8C00] rounded-full flex items-center justify-center text-[10px] sm:text-xs text-white font-bold">迷</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-outfit font-black text-text-primary tracking-tight">小迷糊密室揪團</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/' ? 'bg-accent-light-orange text-text-primary' : 'text-text-secondary hover:bg-bg-secondary'}`}>首頁</Link>
            <Link href="/lobby" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/lobby' ? 'bg-accent-light-orange text-text-primary' : 'text-text-secondary hover:bg-bg-secondary'}`}>立即揪團</Link>
            <Link href="/promotions" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/promotions' ? 'bg-accent-light-orange text-text-primary' : 'text-text-secondary hover:bg-bg-secondary'}`}>優惠</Link>
            <Link href="/about" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/about' ? 'bg-accent-light-orange text-text-primary' : 'text-text-secondary hover:bg-bg-secondary'}`}>關於我們</Link>

            <div className="h-6 w-px bg-[#EBE3D7] mx-2" />

            {!user?.isVisitor ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/profile' ? 'bg-accent-light-orange text-text-primary' : 'text-text-secondary hover:bg-bg-secondary'}`}>
                  {user.photoURL && <img src={user.photoURL} className="w-5 h-5 rounded-full ring-2 ring-accent-orange/20" alt="" />}
                  個人資料
                </Link>
                <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">登出</button>
              </div>
            ) : (
              <button onClick={handleLogin} className="px-6 py-2 bg-[#212121] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">登入</button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 text-[#212121] hover:bg-[#EBE3D7] rounded-lg transition-colors shrink-0">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#F7F4EF] z-50 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF8C00] rounded-full flex items-center justify-center text-xs text-white font-bold">迷</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#212121]">小迷糊密室揪團平台</h2>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-[#7A7A7A] hover:bg-[#EBE3D7] rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-3">
                {/* 1. 首頁 */}
                <Link href="/" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-white text-[#212121] font-bold border border-[#EBE3D7] shadow-sm hover:bg-[#EBE3D7] transition-all">
                  <div className="flex items-center gap-3">
                    <Home size={18} className="text-[#7A7A7A]" />
                    <span>首頁</span>
                  </div>
                </Link>

                {/* 2. 立即揪團 (Prominent Style) */}
                <Link href="/lobby" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-[#FFE4B5] text-[#212121] font-bold shadow-md hover:bg-[#FFD700] transition-all">
                  <div className="flex items-center gap-3">
                    <ArrowRight size={18} />
                    <span>立即揪團</span>
                  </div>
                </Link>

                {/* 3. 個人資料 (登入後顯示) */}
                {!user?.isVisitor && (
                  <Link href="/profile" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-white text-[#212121] font-bold border border-[#EBE3D7] shadow-sm hover:bg-[#EBE3D7] transition-all">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="" /> : <User size={18} className="text-[#7A7A7A]" />}
                      <span>個人資料 ({user.displayName})</span>
                    </div>
                  </Link>
                )}

                {/* 4. 優惠 */}
                <Link href="/promotions" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-white text-[#212121] font-bold border border-[#EBE3D7] shadow-sm hover:bg-[#EBE3D7] transition-all">
                  <div className="flex items-center gap-3">
                    <Ticket size={18} className="text-[#7A7A7A]" />
                    <span>優惠情報</span>
                  </div>
                </Link>

                {/* 5. 關於我們 */}
                <Link href="/about" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-white text-[#212121] font-bold border border-[#EBE3D7] shadow-sm hover:bg-[#EBE3D7] transition-all">
                  <div className="flex items-center gap-3">
                    <Info size={18} className="text-[#7A7A7A]" />
                    <span>關於我們</span>
                  </div>
                </Link>

                {/* 6. 登入/登出 */}
                <div className="pt-4 mt-4 border-t border-[#EBE3D7]">
                  {!user?.isVisitor ? (
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-50 text-red-500 font-bold border border-red-100 transition-all">
                      <LogOut size={18} />
                      <span>登出帳號</span>
                    </button>
                  ) : (
                    <button onClick={handleLogin} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#212121] text-white font-bold shadow-lg transition-all hover:opacity-90">
                      <LogIn size={18} />
                      <span>Google 登入</span>
                    </button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="py-4 md:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

