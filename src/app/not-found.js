import Link from 'next/link';
import { Home, Compass, Map } from 'lucide-react';
import AppLayout from './components/AppLayout';

export default function NotFound() {
    return (
        <AppLayout>
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
                {/* Background Decoration */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-orange/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-accent-orange/3 rounded-full blur-3xl" />
                </div>

                {/* 404 Visual */}
                <div className="relative mb-4 sm:mb-8">
                    <div className="text-[10rem] sm:text-[15rem] font-black font-outfit bg-gradient-to-b from-accent-orange/20 to-transparent bg-clip-text text-transparent leading-none select-none animate-pulse-glow">
                        404
                    </div>
                </div>

                {/* Text Content */}
                <h1 className="text-fluid-h2 font-outfit text-text-primary mb-4 tracking-tight">
                    糟糕！你好像<span className="text-accent-orange">迷路</span>了
                </h1>
                <p className="text-lg text-text-secondary mb-10 max-w-md mx-auto leading-relaxed">
                    這個房間似乎沒有謎題，也沒有出路。<br />
                    別擔心，我們幫你準備了傳送門回到大廳。
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Link
                        href="/lobby"
                        className="btn-primary group flex items-center gap-2 px-8 py-3 text-lg shadow-xl shadow-accent-orange/20 hover:scale-105 transition-transform"
                    >
                        <Compass size={22} className="group-hover:rotate-180 transition-transform duration-700" />
                        回到大廳找團
                    </Link>
                    <Link
                        href="/"
                        className="btn-secondary flex items-center gap-2 px-8 py-3 text-lg hover:bg-white/80 transition-colors"
                    >
                        <Home size={20} />
                        回首頁
                    </Link>
                </div>

                {/* Decoration Icons */}
                <div className="mt-16 grid grid-cols-3 gap-8 opacity-20">
                    <div className="animate-float" style={{ animationDelay: '0s' }}>
                        <Compass size={32} />
                    </div>
                    <div className="animate-float-slow" style={{ animationDelay: '1s' }}>
                        <Map size={32} />
                    </div>
                    <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                        <Compass size={32} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
