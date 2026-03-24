import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="py-16 px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Image src="/complyrlogo.svg" alt="Complyr" width={120} height={32} className="h-8 w-auto mb-4" />
            <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
              Private, compliant, automated payroll for global teams — built on Flow EVM and Zama fhEVM.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#technology" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Technology
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Built with</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://flow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Flow EVM
                </a>
              </li>
              <li>
                <a
                  href="https://zama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Zama fhEVM
                </a>
              </li>
              <li>
                <a
                  href="https://docs.pimlico.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Pimlico (ERC-4337)
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/Stoneybro/complyr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/stoneybro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-gray-600">© 2026 Complyr</p>
          <p className="text-sm text-gray-600">
            Built for PL Genesis Hackathon 2026 · Flow + Zama tracks · by Zion Livingstone
          </p>
        </div>
      </div>
    </footer>
  );
}
