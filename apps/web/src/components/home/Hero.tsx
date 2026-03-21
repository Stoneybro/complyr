import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-4xl">
          <h1 className="text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight mb-6">
            Compliance-ready payment infrastructure for global businesses on-chain
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-12 max-w-3xl">
            MantlePay enables businesses to automate global payroll with built-in compliance tracking across jurisdictions—powered by Mantle's low-cost infrastructure and MNT.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/wallet" className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="https://github.com/Stoneybro/mantlepay" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-gray-300 text-gray-900 font-medium hover:border-gray-400 transition-colors text-center">
              View Documentation
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">Jurisdiction-aware payment tracking</p>
            </div>
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">Built-in tax category classification</p>
            </div>
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">One-click compliance exports</p>
            </div>
            <div className="border-l-2 border-gray-900 pl-4">
              <p className="text-sm text-gray-900 font-medium">Automated cross-border payroll</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
