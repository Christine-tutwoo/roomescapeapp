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
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/90 backdrop-blur-xl border-t border-accent-beige/20 pb-safe z-40 md:hidden">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <Link
          href="/lobby"
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/lobby') ? 'text-accent-orange' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <Search size={24} className={isActive('/lobby') ? 'scale-110 active:scale-95 transition-transform' : ''} />
          <span className="text-[10px] font-bold font-outfit uppercase tracking-wider">找團</span>
        </Link>
        <Link
          href="/promotions"
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/promotions') ? 'text-accent-orange' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <Ticket size={24} className={isActive('/promotions') ? 'scale-110 active:scale-95 transition-transform' : ''} />
          <span className="text-[10px] font-bold font-outfit uppercase tracking-wider">優惠</span>
        </Link>
        <button
          onClick={handleCreateClick}
          className="flex flex-col items-center justify-center -mt-8 bg-accent-orange text-white w-14 h-14 rounded-full shadow-premium active:scale-90 transition-all hover:scale-105"
          aria-label="新增揪團"
        >
          <Plus size={32} className="stroke-[3]" />
        </button>
        <Link
          href="/profile"
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/profile') ? 'text-accent-orange' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <UserPlus size={24} className={isActive('/profile') ? 'scale-110 active:scale-95 transition-transform' : ''} />
          <span className="text-[10px] font-bold font-outfit uppercase tracking-wider">我的</span>
        </Link>
        <Link
          href="/about"
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/about') ? 'text-accent-orange' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <Info size={24} className={isActive('/about') ? 'scale-110 active:scale-95 transition-transform' : ''} />
          <span className="text-[10px] font-bold font-outfit uppercase tracking-wider">資訊</span>
        </Link>
      </div>
    </nav>
  );
}




