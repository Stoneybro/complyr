"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function Problem() {
  return (
    <section className="py-32 px-6 md:px-12 bg-surface-container-low border-y border-outline-variant/20 overflow-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="md:col-span-4"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline">The gap nobody talks about</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="md:col-span-8"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-16 leading-tight">
            Blockchain transactions lack the business context needed for credible audits.
          </h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "circOut", delay: 0.4 }}
            className="h-px w-full bg-outline-variant/30 mb-8 origin-left"
          />
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            While the transfer itself is permanently recorded, the actual business context, like expense categories, jurisdictions, and reviewer checks, remains scattered across emails and spreadsheets. For a business, this missing connection creates a weak audit trail.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
