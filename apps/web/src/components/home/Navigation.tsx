"use client";
import React from 'react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-4 md:px-6 py-4 mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-none border-b border-black/10 dark:border-white/10 z-50">
      <div className="text-xl font-bold tracking-tighter text-black dark:text-white">
        <div className="flex items-center gap-3">
          <img
            alt="COMPLYR Logo"
            className="h-8 w-auto block dark:hidden"
            src="/complyrlogo-dark.svg"
          />
          <img
            alt="COMPLYR Logo"
            className="h-8 w-auto hidden dark:block"
            src="/complyrlogo-light.svg"
          />
          <span className="font-bold uppercase tracking-tighter text-2xl">Complyr</span>
        </div>
      </div>
      <nav className="hidden md:flex gap-8 items-center pr-6">
        <Link
          href="/docs"
          className="relative text-xs font-semibold uppercase tracking-widest text-black dark:text-white group py-1"
        >
          Documentation
          <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Link>
        <Link
          href="https://github.com/Stoneybro/complyr"
          target="_blank"
          rel="noopener noreferrer"
          className="relative text-xs font-semibold uppercase tracking-widest text-black dark:text-white group py-1"
        >
          GitHub
          <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Link>
      </nav>
      <Link
        href="/login"
        className="bg-primary text-on-primary px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:opacity-90 active:opacity-70 transition-all cursor-pointer"
      >
        Try the demo
      </Link>
    </header>
  );
}
