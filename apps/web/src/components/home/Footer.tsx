export default function Footer() {
  return (
    <footer className="py-16 px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 mb-12">
          <div className="md:col-span-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">MantlePay</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Compliant financial infrastructure for global businesses operating on-chain.
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
                  How it Works
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Use Cases
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Ecosystem</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://mantle.xyz" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Mantle Network
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  MNT
                </a>
              </li>
              <li>
                <a href="https://chain.link/automation" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Chainlink Automation
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://twitter.com/mantlepay" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://github.com/stoneybro/mantlepay" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-gray-600">© 2026 MantlePay</p>
          <p className="text-sm text-gray-600">Built for the Mantle Global Hackathon 2025 | Zion Livingstone</p>
        </div>
      </div>
    </footer>
  );
}
