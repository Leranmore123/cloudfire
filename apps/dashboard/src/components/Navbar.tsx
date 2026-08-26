'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken, fetchApi } from '../lib/api-client';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register') return;

    fetchApi('/api/auth/me').then((res) => {
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        router.push('/login');
      }
    });
  }, [pathname, router]);

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-[#1e293b] bg-[#0c1220]/70 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white capitalize">
          {pathname === '/' ? 'Platform Overview' : pathname.replace('/', '').replace('-', ' ')}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{user.name}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
