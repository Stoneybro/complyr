'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-200 ${isScrolled ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200' : 'bg-white'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Image src="/mantlepay.svg" alt="MantlePay" width={120} height={32} className="h-8 w-auto" />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#technology" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Technology
            </a>
            <a href="#why-mneepay" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Why MneePay
            </a>
            <Link href="https://github.com/Stoneybro/mneepaymenthub" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              GitHub
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/wallet" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/wallet" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
