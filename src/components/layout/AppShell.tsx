'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 antialiased selection:bg-teal-500 selection:text-white transition-colors duration-200">
      {/* Background ambient lighting for Dark Mode */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden hidden dark:block">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-600/5 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-teal-600/8 blur-[140px]" />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 z-10 min-h-screen justify-between">
        <div>
          <Navbar />
          <main className="p-6 md:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}
