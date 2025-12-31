import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bg-secondary/50 border-t border-accent-beige/20 mt-20">
      <div className="max-w-md md:max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/terms"
              className="text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              使用條款
            </Link>
            <Link
              href="/privacy"
              className="text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              隱私權政策
            </Link>
            <a
              href="https://www.instagram.com/hu._escaperoom/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <Instagram size={14} className="text-accent-orange" />
              聯繫我們
            </a>
            <Link
              href="/about"
              className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <MessageCircle size={14} className="text-accent-orange" />
              關於我們
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center pt-6 border-t border-accent-beige/20 w-full max-w-md">
            <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-bold">
              © {new Date().getFullYear()} 小迷糊密室揪團. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


