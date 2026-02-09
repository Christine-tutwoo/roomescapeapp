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
      <div className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="card-premium p-10 max-w-md w-full relative overflow-hidden group">
          {/* 幾何裝飾形狀 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-tertiary/10 rounded-full translate-y-1/4 -translate-x-1/4" />
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-foreground animate-pulse" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
              <span className="text-5xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">請使用瀏覽器開啟</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              為了確保帳戶安全，Google 限制在應用程式內智慧瀏覽器中進行登入。
            </p>
            <div className="bg-card rounded-xl p-6 text-sm text-foreground text-left border-2 border-foreground" style={{ boxShadow: '4px 4px 0px 0px #E2E8F0' }}>
              <p className="font-bold text-accent mb-3 uppercase tracking-wider text-[10px]">操作指南</p>
              <ol className="list-decimal list-inside space-y-3 font-medium">
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
    <div className="min-h-screen bg-bg selection:bg-accent/20 noise-bg">
      {/* Header - Playful Geometric 風格 */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b-2 border-foreground" style={{ boxShadow: '0 4px 0px 0px #1E293B' }}>
        <div className="px-4 py-3 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-accent rounded-full flex items-center justify-center text-[10px] sm:text-xs text-accent-foreground font-bold border-2 border-foreground" style={{ boxShadow: '2px 2px 0px 0px #1E293B' }}>迷</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">小迷糊密室揪團</h1>
            </Link>
          </div>

          {/* Desktop Navigation - Playful Geometric 風格 */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2 ${pathname === '/' ? 'bg-accent text-accent-foreground border-foreground' : 'bg-transparent text-muted-foreground border-transparent hover:bg-tertiary hover:text-foreground hover:border-foreground'}`} style={pathname === '/' ? { boxShadow: '4px 4px 0px 0px #1E293B' } : {}}>首頁</Link>
            <Link href="/lobby" className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2 ${pathname === '/lobby' ? 'bg-accent text-accent-foreground border-foreground' : 'bg-transparent text-muted-foreground border-transparent hover:bg-tertiary hover:text-foreground hover:border-foreground'}`} style={pathname === '/lobby' ? { boxShadow: '4px 4px 0px 0px #1E293B' } : {}}>立即揪團</Link>
            <Link href="/promotions" className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2 ${pathname === '/promotions' ? 'bg-accent text-accent-foreground border-foreground' : 'bg-transparent text-muted-foreground border-transparent hover:bg-tertiary hover:text-foreground hover:border-foreground'}`} style={pathname === '/promotions' ? { boxShadow: '4px 4px 0px 0px #1E293B' } : {}}>優惠</Link>
            <Link href="/about" className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2 ${pathname === '/about' ? 'bg-accent text-accent-foreground border-foreground' : 'bg-transparent text-muted-foreground border-transparent hover:bg-tertiary hover:text-foreground hover:border-foreground'}`} style={pathname === '/about' ? { boxShadow: '4px 4px 0px 0px #1E293B' } : {}}>關於我們</Link>

            <div className="h-6 w-px bg-foreground/20 mx-2" />

            {!user?.isVisitor ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2 ${pathname === '/profile' ? 'bg-accent text-accent-foreground border-foreground' : 'bg-transparent text-muted-foreground border-transparent hover:bg-tertiary hover:text-foreground hover:border-foreground'}`} style={pathname === '/profile' ? { boxShadow: '4px 4px 0px 0px #1E293B' } : {}}>
                  {user.photoURL && <img src={user.photoURL} className="w-5 h-5 rounded-full border-2 border-foreground" alt="" />}
                  個人資料
                </Link>
                <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-secondary hover:bg-secondary/10 rounded-full transition-all duration-300 active:scale-95 border-2 border-transparent hover:border-secondary">登出</button>
              </div>
            ) : (
              <button onClick={handleLogin} className="btn-primary px-6 py-2 text-sm font-bold">登入</button>
            )}
          </nav>

          {/* Mobile Menu Button - Playful Geometric 風格 */}
          <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 text-foreground hover:bg-accent/10 rounded-full transition-all duration-300 shrink-0 active:scale-95 border-2 border-transparent hover:border-foreground">
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay - Playful Geometric 風格 */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-card z-50 border-l-2 border-foreground animate-in slide-in-from-right duration-300 overflow-y-auto" style={{ boxShadow: '-4px 0px 0px 0px #1E293B' }}>
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover border-2 border-foreground" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-xs text-accent-foreground font-bold border-2 border-foreground" style={{ boxShadow: '2px 2px 0px 0px #1E293B' }}>迷</span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">小迷糊密室揪團平台</h2>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-muted-foreground hover:bg-accent/10 rounded-full transition-all border-2 border-transparent hover:border-foreground">
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              <nav className="space-y-3">
                {/* 1. 首頁 */}
                <Link href="/" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-card text-foreground font-bold border-2 border-foreground transition-all hover:-rotate-1 hover:scale-[1.02]" style={{ boxShadow: '4px 4px 0px 0px #E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <Home size={18} className="text-muted-foreground" strokeWidth={2.5} />
                    <span>首頁</span>
                  </div>
                </Link>

                {/* 2. 立即揪團 (Prominent Style) */}
                <Link href="/lobby" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-tertiary text-foreground font-bold border-2 border-foreground transition-all hover:-rotate-1 hover:scale-[1.02]" style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}>
                  <div className="flex items-center gap-3">
                    <ArrowRight size={18} strokeWidth={2.5} />
                    <span>立即揪團</span>
                  </div>
                </Link>

                {/* 3. 個人資料 (登入後顯示) */}
                {!user?.isVisitor && (
                  <Link href="/profile" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-card text-foreground font-bold border-2 border-foreground transition-all hover:-rotate-1 hover:scale-[1.02]" style={{ boxShadow: '4px 4px 0px 0px #E2E8F0' }}>
                    <div className="flex items-center gap-3">
                      {user.photoURL ? <img src={user.photoURL} className="w-5 h-5 rounded-full border-2 border-foreground" alt="" /> : <User size={18} className="text-muted-foreground" strokeWidth={2.5} />}
                      <span>個人資料 ({user.displayName})</span>
                    </div>
                  </Link>
                )}

                {/* 4. 優惠 */}
                <Link href="/promotions" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-card text-foreground font-bold border-2 border-foreground transition-all hover:-rotate-1 hover:scale-[1.02]" style={{ boxShadow: '4px 4px 0px 0px #E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <Ticket size={18} className="text-muted-foreground" strokeWidth={2.5} />
                    <span>優惠情報</span>
                  </div>
                </Link>

                {/* 5. 關於我們 */}
                <Link href="/about" onClick={() => setShowMobileMenu(false)} className="block w-full px-4 py-3 rounded-xl bg-card text-foreground font-bold border-2 border-foreground transition-all hover:-rotate-1 hover:scale-[1.02]" style={{ boxShadow: '4px 4px 0px 0px #E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <Info size={18} className="text-muted-foreground" strokeWidth={2.5} />
                    <span>關於我們</span>
                  </div>
                </Link>

                {/* 6. 登入/登出 */}
                <div className="pt-4 mt-4 border-t-2 border-foreground">
                  {!user?.isVisitor ? (
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-card text-secondary font-bold border-2 border-secondary transition-all hover:-rotate-1 hover:scale-[1.02]" style={{ boxShadow: '4px 4px 0px 0px #E2E8F0' }}>
                      <LogOut size={18} strokeWidth={2.5} />
                      <span>登出帳號</span>
                    </button>
                  ) : (
                    <button onClick={handleLogin} className="btn-primary flex items-center gap-3 w-full px-4 py-3">
                      <LogIn size={18} strokeWidth={2.5} />
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-24">
        <div className="py-6 md:py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

