"use client";

import React from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: 'schedule',
    title: 'Payroll & Subscriptions',
    body: 'Automated, stateful recurring payments. Manage employee salaries and subscriptions securely on-chain.',
  },
  {
    icon: 'layers',
    title: 'Batch Payouts',
    body: 'Execute mass vendor payments in a single transaction. Highly scalable infrastructure designed to save gas.',
  },
  {
    icon: 'payments',
    title: 'Single Transfers',
    body: 'Fast, reliable direct B2B transactions. The foundational layer for moving treasury funds efficiently.',
  },
  {
    icon: 'lock',
    title: 'Data Privacy',
    body: 'Sensitive compliance data and payment amounts are secured with Zama FHE on Ethereum Sepolia.',
  },
  {
    icon: 'fingerprint',
    title: 'Account Abstraction',
    body: 'Seamless gasless transactions and simple Web2-style social logins for frictionless enterprise onboarding.',
  },
  {
    icon: 'policy',
    title: 'Auditor Portal',
    body: 'An isolated environment for external regulators to verify compliance proofs without exposing underlying corporate data.',
  },
];

export default function Features() {
  return (
    <section className="py-32 px-6 md:px-12 bg-surface-container-high overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline block mb-4">Built for real business operations</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl">Everything a corporate treasury needs. Nothing it doesn't.</h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-variant/20 border border-outline-variant/20 mt-12">
          {features.map((f, i) => (
            <div 
              key={f.title}
              className="bg-surface p-10 flex flex-col justify-between min-h-[280px] hover:bg-surface-container-high transition-colors"
            >
              <div>
                <span className="material-symbols-outlined text-3xl mb-6 text-on-surface">{f.icon}</span>
                <h3 className="font-bold uppercase text-sm tracking-widest mb-4">{f.title}</h3>
              </div>
              <p className="text-sm text-on-surface-variant">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
