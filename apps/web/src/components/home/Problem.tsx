"use client"
import { motion } from "framer-motion";
import { X, Check, Clock, Wallet, Shield, Zap, FileWarning, Cog } from "lucide-react";

const oldWayItems = [
  { icon: Clock, text: "Manual jurisdiction tracking for each payment" },
  { icon: Wallet, text: "Separate tools for W2, 1099, and international contractors" },
  { icon: FileWarning, text: "Hours spent categorizing transactions for tax reporting" },
  { icon: Cog, text: "No audit trail linking payments to compliance metadata" },
];

const newWayItems = [
  { icon: Zap, text: "Automatic jurisdiction detection and tagging" },
  { icon: Shield, text: "Universal compliance metadata for all payment types" },
  { icon: Check, text: "Real-time compliance dashboard with CSV exports" },
  { icon: Check, text: "Immutable on-chain audit trail for every payment" },
];

export default function Problem() {
  return (
    <section id="problem" className="py-20 md:py-28 lg:py-32 relative overflow-hidden bg-secondary">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-4">
            Cross-border payroll compliance is{" "}
            <span className="text-muted-foreground">broken</span>
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Traditional payment systems weren't designed for global teams operating across multiple tax jurisdictions with different employment classifications.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-card p-8 h-full rounded-lg border border-muted hover:border-muted-foreground/30 transition-colors">
              {/* Subtle glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-muted/50 to-transparent rounded-lg blur-xl opacity-50" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold leading-tight">The Old Way</h3>
                </div>

                <p className="text-muted-foreground mb-8">
                  Manual jurisdiction tracking, separate tools for contractors, and no audit trails.
                </p>

                <div className="space-y-4">
                  {oldWayItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-muted"
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Visual mockup - broken dashboard */}
                <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
                      <div className="text-xs text-muted-foreground">⚠ Uncategorized</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-32 bg-muted-foreground/20 rounded" />
                      <div className="text-xs text-muted-foreground">⏳ Missing Jurisdiction</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-20 bg-muted-foreground/20 rounded" />
                      <div className="text-xs text-muted-foreground">✗ Audit Failed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* The MantlePay Way */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative bg-card p-8 h-full rounded-lg border border-primary/30 hover:border-primary/50 transition-colors">
              {/* Primary glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-l from-primary/15 to-transparent rounded-lg blur-xl opacity-50" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold leading-tight">The MantlePay Way</h3>
                </div>

                <p className="text-muted-foreground mb-8">
                  Automatic jurisdiction tagging, universal compliance metadata, and audit-ready reports.
                </p>

                <div className="space-y-4">
                  {newWayItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground/80">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Visual mockup - smooth dashboard */}
                <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-24 bg-primary/20 rounded" />
                      <div className="text-xs text-primary">✓ Compliant (US-CA)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-32 bg-primary/20 rounded" />
                      <div className="text-xs text-primary">✓ Tax Tagged (W2)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-20 bg-primary/20 rounded" />
                      <div className="text-xs text-primary">✓ Export Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
