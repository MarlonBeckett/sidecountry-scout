'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, MessageSquare, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-5 pb-6 z-50 pointer-events-none">
      <div className="relative bg-gradient-to-b from-surface-dark to-surface-lighter backdrop-blur-2xl border-2 border-primary/20 rounded-[2rem] h-20 shadow-elevation flex items-center justify-between px-4 max-w-md mx-auto pointer-events-auto">
        {/* Subtle top glow */}
        <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

        {/* Briefing */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center gap-2 h-full transition-all rounded-2xl ${
            isActive('/')
              ? 'text-primary scale-105'
              : 'text-slate-400 hover:text-white hover:scale-105'
          }`}
        >
          <FileText size={23} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className={`text-[9px] font-display font-bold uppercase tracking-[0.1em] ${
            isActive('/') ? 'text-primary' : 'text-slate-500'
          }`}>
            Briefing
          </span>
        </Link>

        {/* Chat */}
        <Link
          href="/chat"
          className={`flex-1 flex flex-col items-center justify-center gap-2 h-full transition-all rounded-2xl relative ${
            isActive('/chat')
              ? 'text-primary scale-105'
              : 'text-slate-400 hover:text-white hover:scale-105'
          }`}
        >
          <div className="relative">
            <MessageSquare size={23} strokeWidth={isActive('/chat') ? 2.5 : 2} />
            <span className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full border-2 border-surface-dark animate-pulse"></span>
          </div>
          <span className={`text-[9px] font-display font-bold uppercase tracking-[0.1em] ${
            isActive('/chat') ? 'text-primary' : 'text-slate-500'
          }`}>
            Chat
          </span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center justify-center gap-2 h-full transition-all rounded-2xl ${
            isActive('/profile')
              ? 'text-primary scale-105'
              : 'text-slate-400 hover:text-white hover:scale-105'
          }`}
        >
          <User size={23} strokeWidth={isActive('/profile') ? 2.5 : 2} />
          <span className={`text-[9px] font-display font-bold uppercase tracking-[0.1em] ${
            isActive('/profile') ? 'text-primary' : 'text-slate-500'
          }`}>
            Profile
          </span>
        </Link>

      </div>
    </div>
  );
}
