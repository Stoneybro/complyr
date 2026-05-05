"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section className="py-40 px-6 md:px-12 bg-primary text-on-primary relative overflow-hidden">
      <div className="absolute inset-0 grain-overlay"></div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-10 leading-none"
        >
          Your business is already operating onchain. Your audit infrastructure should be too.
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl font-light mb-16 opacity-70"
        >
          Complyr is live on Base. Experience the future of institutional-grade onchain finance today.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
          <Link
            href="/login"
            className="bg-on-primary text-primary px-12 py-6 text-sm font-bold uppercase tracking-[0.2em] hover:bg-surface-dim hover:scale-105 active:scale-95 transition-all text-center"
          >
            Try the demo
          </Link>
          <Link
            href="/docs"
            className="border border-on-primary text-on-primary px-12 py-6 text-sm font-bold uppercase tracking-[0.2em] hover:bg-on-primary hover:text-primary hover:scale-105 active:scale-95 transition-all text-center"
          >
            Read the docs
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
