'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Ticket, Plus, UserPlus, Info } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path) => {
    if (path === '/lobby') {
      return pathname === '/lobby';
    }
    return pathname === path;
  };

  const handleCreateClick = () => {
    // Navigate to lobby with create mode
    router.push('/lobby?action=create');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t-2 border-foreground pb-safe z-40 md:hidden" style={{ boxShadow: '0 -4px 0px 0px #1E293B' }}>
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <Link
          href="/lobby"
          className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${isActive('/lobby') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive('/lobby') ? 'bg-accent/10' : ''}`} />
          <Search size={24} className={`relative z-10 transition-transform duration-300 ${isActive('/lobby') ? 'scale-110' : ''} active:scale-95`} strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">找團</span>
        </Link>
        <Link
          href="/promotions"
          className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${isActive('/promotions') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive('/promotions') ? 'bg-accent/10' : ''}`} />
          <Ticket size={24} className={`relative z-10 transition-transform duration-300 ${isActive('/promotions') ? 'scale-110' : ''} active:scale-95`} strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">優惠</span>
        </Link>
        <button
          onClick={handleCreateClick}
          className="fab flex items-center justify-center -mt-8 relative z-20"
          aria-label="新增揪團"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
        <Link
          href="/profile"
          className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${isActive('/profile') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive('/profile') ? 'bg-accent/10' : ''}`} />
          <UserPlus size={24} className={`relative z-10 transition-transform duration-300 ${isActive('/profile') ? 'scale-110' : ''} active:scale-95`} strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">我的</span>
        </Link>
        <Link
          href="/about"
          className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${isActive('/about') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive('/about') ? 'bg-accent/10' : ''}`} />
          <Info size={24} className={`relative z-10 transition-transform duration-300 ${isActive('/about') ? 'scale-110' : ''} active:scale-95`} strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">資訊</span>
        </Link>
      </div>
    </nav>
  );
}





