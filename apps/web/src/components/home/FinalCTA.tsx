import { Github } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-20 px-6 lg:px-8 bg-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-semibold text-gray-900 mb-6">
            Build compliant global payroll on-chain
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            MantlePay turns cross-border payments into programmable, auditable, jurisdiction-aware workflows on Mantle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/wallet" className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors text-center">
              Get Started
            </Link>
            <Link href="https://github.com/Stoneybro/mantlepaymenthub" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-gray-300 text-gray-900 font-medium hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
              <Github className="w-4 h-4" />
              View on GitHub
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">No credit card required</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Open-source codebase</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Deploy in minutes</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                <span className="text-sm text-gray-600">Full compliance tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
