'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Terminal, Activity, ArrowRight } from 'lucide-react';
import { checkBackendHealth } from '@/lib/api';

export default function Navbar() {
  const [health, setHealth] = useState<any>(null);
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    let mounted = true;
    checkBackendHealth()
      .then((data) => {
        if (mounted) {
          setHealth(data);
          setStatus('connected');
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus('disconnected');
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-black">
      <div className="h-20 max-w-[1440px] mx-auto px-6 sm:px-8 flex items-center justify-between gap-6 font-mono">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center shrink-0 brutal-shadow-sm group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-all">
              <Compass className="w-5 h-5 text-[#72C7E8] group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-black uppercase">
                OSS Compass
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#D5F5EF] text-black border border-black brutal-shadow-sm">
                V0.1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav */}
        <nav className="hidden lg:flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
          <Link
            href="/"
            className="px-3.5 py-2 border-2 border-transparent hover:border-black font-bold transition-all hover:bg-[#D5F5EF] hover:brutal-shadow-sm"
          >
            // Discovery
          </Link>
          <Link
            href="/#demo-repos"
            className="px-3.5 py-2 border-2 border-transparent hover:border-black font-bold transition-all hover:bg-[#D5F5EF] hover:brutal-shadow-sm"
          >
            // Repositories
          </Link>
          <Link
            href="/#issue-proof"
            className="px-3.5 py-2 border-2 border-transparent hover:border-black font-bold transition-all hover:bg-[#D5F5EF] hover:brutal-shadow-sm"
          >
            // IssueProof
          </Link>
          <Link
            href="/repo/fastapi/fastapi"
            className="px-3.5 py-2 border-2 border-transparent hover:border-black font-bold transition-all hover:bg-[#DCEFFD] hover:brutal-shadow-sm"
          >
            // Live Workspace
          </Link>
        </nav>

        {/* Right Status Badges & CTAs */}
        <div className="flex items-center gap-3">
          {/* AI Model Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#DCEFFD] border-2 border-black brutal-shadow-sm text-xs font-bold text-black">
            <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
            <span>Gemma 4</span>
          </div>

          {/* Trigger.dev Backend Health Badge */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 border-2 border-black brutal-shadow-sm text-xs font-bold ${
              status === 'connected'
                ? 'bg-[#D5F5EF] text-black'
                : status === 'checking'
                ? 'bg-amber-100 text-amber-950'
                : 'bg-rose-100 text-rose-950'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full border border-black ${
                status === 'connected'
                  ? 'bg-[#10b981] animate-ping'
                  : status === 'checking'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {status === 'connected' ? 'API+Trigger.dev' : status === 'checking' ? 'Syncing...' : 'Offline'}
            </span>
          </div>

          {/* GitHub CTA */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn flex items-center gap-1.5 px-3.5 py-2 border-2 border-black bg-white font-mono text-xs uppercase font-bold brutal-shadow-sm text-black hover:bg-black hover:text-[#72C7E8]"
            title="GitHub"
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* Workspace Quick Jump */}
          <Link
            href="/repo/fastapi/fastapi"
            className="brutal-btn hidden sm:inline-flex items-center justify-center font-mono text-xs uppercase bg-black text-[#72C7E8] border-2 border-black px-4 py-2 brutal-shadow-md font-bold"
          >
            WORKSPACE
          </Link>
        </div>
      </div>
    </header>
  );
}
