import { Button } from "@/components/ui/button";
import { Zap, DollarSign, Fuel, Shield } from "lucide-react";
import Link from "next/link";

const benefits = [
  { icon: Zap, text: "Ultra-low fees (under $1 for 50-person payroll)" },
  { icon: DollarSign, text: "Fast finality (seconds)" },
  { icon: Fuel, text: "EVM compatible" },
  { icon: Shield, text: "Secured by Ethereum + Mantle DA" },
];

const integrationBenefits = [
  "Predictable payroll costs regardless of team size",
  "Efficient batch processing for global teams",
  "Built-in compliance tracking at infrastructure level",
  "Audit-ready transaction history on Mantle Explorer",
];

export default function MantleChain() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
              Powered by Mantle Network's infrastructure for real-world finance
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground mt-4">
              MantlePay leverages Mantle's low-cost, high-performance L2 to make compliant global payroll economically viable for businesses of any size.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center">
                    <benefit.icon size={16} className="text-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-background rounded-lg p-8 border border-border">
            <h3 className="text-xl md:text-2xl font-semibold leading-tight">Integration Benefits</h3>
            <ul className="mt-6 space-y-4">
              {integrationBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
