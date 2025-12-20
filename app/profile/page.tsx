'use client';

import BottomNav from '@/components/BottomNav';
import { Settings, BadgeCheck, Calendar, Shield, Plus, Snowflake, Wrench, Radio, BatteryFull, ChevronRight, AlertTriangle, Map, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth');
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-body text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-black pb-32 max-w-md mx-auto border-x border-primary/10">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden pb-24">
        {/* Top App Bar */}
        <div className="flex items-center px-5 py-4 justify-between sticky top-0 z-20 bg-gradient-to-b from-background-dark to-background-dark/95 backdrop-blur-xl border-b border-primary/10 opacity-0 animate-fade-in-up">
          <button className="flex size-10 items-center justify-center rounded-xl hover:bg-white/5 active:scale-95 transition-all text-slate-400 hover:text-white">
            <Settings size={22} />
          </button>
          <h2 className="text-xl font-display font-bold leading-tight tracking-wide flex-1 text-center text-white">PROFILE</h2>
          <button className="px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all border border-primary/20">
            <span className="text-primary text-[11px] font-display font-bold tracking-[0.1em] uppercase">Edit</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col items-center pt-8 pb-6 px-5 w-full opacity-0 animate-fade-in-up delay-100">
          <div className="relative mb-6 group cursor-pointer">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full h-32 w-32 ring-4 ring-surface-dark shadow-elevation relative z-10 border-2 border-primary/30 group-hover:border-primary/50 transition-all"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCub-qVOcXjWMUfOytaeRV0sydzhx-XBZdyJY6I6xHL3_54tI8d2vw6fVDpm-OoeNEcpvqvmzQbtr3bN-nckw9GUpUTdgg6L0x9Cl6eBpNqWDNxC2V8zu93lVo0ATxiPjYyM2uxMGb201AR0Jpf7SBE7uNnbIzZ12SFqn_BiS7_1aT4q-SwR38UmfiM3RrFP3yQzZPe96PfwWDokFCPr6tsn7poqRbYcX6JlBwjau10plD3mxUqjwMJYkrqcLXJ9YC5QUAPYg-cwWj6")`,
              }}
            ></div>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-primary to-glacier text-black rounded-full p-2 border-3 border-background-dark shadow-lg">
              <BadgeCheck size={18} className="fill-black" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3">
            <h1 className="text-3xl font-display font-bold leading-tight tracking-wide text-center text-white uppercase">{user.email?.split('@')[0] || 'USER'}</h1>
            <div className="px-4 py-1.5 rounded-lg bg-surface-dark border border-primary/30 flex items-center gap-2 backdrop-blur-sm">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
              <p className="text-primary text-[10px] font-display font-bold uppercase tracking-[0.15em]">Scout Active</p>
            </div>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 px-5 py-4 opacity-0 animate-fade-in-up delay-200">
          <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-surface-dark to-surface-lighter border border-primary/20 p-5 items-center text-center backdrop-blur-sm shadow-lg hover:border-primary/40 transition-all group">
            <p className="text-white text-3xl font-display font-bold leading-none group-hover:text-primary transition-colors">24</p>
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-glacier" />
              <p className="text-slate-400 text-[10px] font-display font-medium uppercase tracking-[0.1em]">Days Tracked</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-surface-dark to-surface-lighter border border-primary/20 p-5 items-center text-center backdrop-blur-sm shadow-lg hover:border-primary/40 transition-all group">
            <p className="text-white text-3xl font-display font-bold leading-none group-hover:text-primary transition-colors">98%</p>
            <div className="flex items-center gap-1.5">
              <Shield size={16} className="text-glacier" />
              <p className="text-slate-400 text-[10px] font-display font-medium uppercase tracking-[0.1em]">Safety Score</p>
            </div>
          </div>
        </div>

        {/* My Gear Section */}
        <div className="flex flex-col gap-0 px-5 pt-6 opacity-0 animate-fade-in-up delay-300">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-white text-xl font-display font-bold leading-tight tracking-wide">CURRENT SETUP</h3>
              <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-transparent rounded-full mt-1"></div>
            </div>
            <button className="size-9 flex items-center justify-center rounded-lg bg-surface-dark text-primary hover:bg-primary/10 border border-primary/30 active:scale-95 transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {/* Gear Item 1: Skis */}
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-surface-dark to-surface-lighter p-4 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group shadow-lg active:scale-[0.98]">
              <div className="flex items-center justify-center rounded-xl bg-primary/10 border border-primary/30 shrink-0 size-13 text-primary group-hover:scale-105 transition-transform">
                <Snowflake size={24} />
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-white text-[15px] font-semibold leading-normal truncate">Faction Agent 3.0</p>
                <p className="text-slate-400 text-[13px] font-normal leading-normal truncate">Skis • 180cm</p>
              </div>
              <ChevronRight size={20} className="text-slate-600 group-hover:text-primary transition-colors" />
            </div>

            {/* Gear Item 2: Bindings */}
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-surface-dark to-surface-lighter p-4 border border-glacier/20 hover:border-glacier/40 transition-all cursor-pointer group shadow-lg active:scale-[0.98]">
              <div className="flex items-center justify-center rounded-xl bg-glacier/10 border border-glacier/30 shrink-0 size-13 text-glacier group-hover:scale-105 transition-transform">
                <Wrench size={24} />
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-white text-[15px] font-semibold leading-normal truncate">Shift MNC 13</p>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-400"></span>
                  <p className="text-emerald-400 text-[13px] font-normal leading-normal truncate">Condition: Good</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-600 group-hover:text-glacier transition-colors" />
            </div>

            {/* Gear Item 3: Beacon */}
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-surface-dark to-surface-lighter p-4 border border-sunset/20 hover:border-sunset/40 transition-all cursor-pointer group shadow-lg active:scale-[0.98]">
              <div className="flex items-center justify-center rounded-xl bg-sunset/10 border border-sunset/30 shrink-0 size-13 text-sunset group-hover:scale-105 transition-transform">
                <Radio size={24} />
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-white text-[15px] font-semibold leading-normal truncate">Mammut Barryvox</p>
                <div className="flex items-center gap-1.5">
                  <BatteryFull size={14} className="text-primary" />
                  <p className="text-primary text-[13px] font-normal leading-normal truncate">90% Battery</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-600 group-hover:text-sunset transition-colors" />
            </div>
          </div>
        </div>

        {/* Safety Section */}
        <div className="flex flex-col gap-0 px-5 pt-8 opacity-0 animate-fade-in-up delay-400">
          <div className="mb-4">
            <h3 className="text-white text-xl font-display font-bold leading-tight tracking-wide">SAFETY</h3>
            <div className="h-0.5 w-12 bg-gradient-to-r from-red-500 to-transparent rounded-full mt-1"></div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border-l-4 border-red-500 p-5 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden shadow-lg hover:shadow-red-500/20">
            <div className="flex items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 shrink-0 size-13 text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div className="flex flex-col justify-center flex-1">
              <p className="text-white text-[16px] font-bold leading-normal">Emergency Contacts</p>
              <p className="text-red-300 text-[13px] font-medium leading-normal">2 Contacts Listed</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-display font-bold uppercase tracking-[0.1em] border border-red-500/30">
              View
            </div>
          </div>
        </div>

        {/* System Section */}
        <div className="flex flex-col gap-0 px-5 pt-8 pb-4 opacity-0 animate-fade-in-up delay-500">
          <div className="mb-4">
            <h3 className="text-white text-xl font-display font-bold leading-tight tracking-wide">SYSTEM</h3>
            <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-transparent rounded-full mt-1"></div>
          </div>
          <div className="flex flex-col rounded-xl bg-surface-dark border border-primary/20 overflow-hidden shadow-lg">
            <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors group">
              <Map size={20} className="text-glacier group-hover:text-primary transition-colors" />
              <p className="text-white text-[15px] font-medium flex-1">Offline Maps</p>
              <span className="text-slate-500 text-[13px] font-display">3 Downloaded</span>
            </div>
            <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors group">
              <Bell size={20} className="text-glacier group-hover:text-primary transition-colors" />
              <p className="text-white text-[15px] font-medium flex-1">Notifications</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-red-500/5 active:bg-red-500/10 transition-colors group"
            >
              <LogOut size={20} className="text-red-400 group-hover:text-red-500 transition-colors" />
              <p className="text-red-400 group-hover:text-red-500 text-[15px] font-medium flex-1 text-left transition-colors">Log Out</p>
            </button>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
