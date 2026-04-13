"use client";

import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Smart Vaults',
    label: '01 / SYSTEM TREASURY',
    body: 'Deploy a compliance-aware smart account on HashKey Chain to act as your business\'s primary on-chain treasury.',
  },
  {
    num: '02',
    title: 'Encryption',
    label: '02 / SECURE METADATA',
    body: 'Attach necessary compliance data to your payment. AES-256-GCM encryption keeps this sensitive information completely hidden on-chain.',
  },
  {
    num: '03',
    title: 'Settlement',
    label: '03 / NATIVE EXECUTION',
    body: 'The payment settles natively on HashKey Chain while your encrypted compliance records are permanently anchored in the same transaction.',
  },
  {
    num: '04',
    title: 'Audit',
    label: '04 / VERIFIABLE PROOFS',
    body: 'Authorize specific auditors. They can decrypt and verify the legality of your transactions without exposing your underlying company data to the public.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-32 px-6 md:px-12 bg-surface">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-primary pb-8"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline block mb-4">The Solution</span>
            <h2 className="text-5xl font-bold tracking-tighter uppercase">A dual ledger for every payment.</h2>
          </div>
          <div className="hidden md:block text-right">
            <span className="font-mono text-xs opacity-50">DEMO_BUILD: ALFA</span>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 divide-x divide-outline-variant/20 border border-outline-variant/20">
          {steps.map((step, i) => (
            <motion.div 
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className="p-8 hover:bg-surface-container-lowest transition-colors group"
            >
              <motion.div 
                whileHover={{ scale: 1.05, opacity: 0.5 }}
                className="font-mono text-4xl mb-4 opacity-10 group-hover:opacity-100 transition-opacity origin-left"
              >
                {step.num}
              </motion.div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-outline block mb-6">{step.label}</span>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">{step.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
