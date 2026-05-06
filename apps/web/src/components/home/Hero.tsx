"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 relative overflow-hidden technical-grid">
      <div className="absolute inset-0 grain-overlay" />
      <div className="max-w-6xl w-full mx-auto z-10 flex flex-col items-center text-center">
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: "circOut" }}
          className="h-px w-24 bg-primary mb-8 origin-left" 
        />
        <h1 className="text-[2.5rem] md:text-[6rem] leading-[0.95] font-bold tracking-tighter uppercase mb-8 max-w-5xl">
          Private audit infrastructure for onchain business payments.
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant max-w-3xl font-light mb-12 leading-relaxed mx-auto">
          Complyr is a payments system that attaches encrypted audit records to every payment. Auditors can verify payments against defined rules without decrypting the data.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="bg-primary text-on-primary px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-on-surface-variant hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Try the demo
          </Link>
          <Link
            href="/docs"
            className="border border-primary text-primary px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-surface-container-highest hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Read the docs
          </Link>
        </div>
      </div>
      <div className="absolute bottom-12 left-6 md:left-12 hidden md:flex items-center gap-4">
        <div className="text-[10px] font-mono tracking-widest uppercase opacity-40">SYSTEM_STATUS: OPERATIONAL</div>
        <motion.div 
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="w-1.5 h-1.5 bg-black dark:bg-white" 
        />
      </div>
    </section>
  );
}
