export default function Technology() {
  const layers = [
    {
      title: 'Interface Layer',
      items: ['AI-driven intent parsing with compliance extraction', 'Natural language to structured, jurisdiction-aware payment logic'],
    },
    {
      title: 'Authentication',
      items: ['Embedded wallets via Privy (email/social login)', 'No seed phrases or crypto complexity for end users'],
    },
    {
      title: 'Smart Accounts',
      items: ['ERC-4337 compliant with compliance metadata', 'Batch execution with per-recipient jurisdiction tagging', 'Gas sponsorship', 'Built with Foundry'],
    },
    {
      title: 'Automation',
      items: ['On-chain intent registry with compliance preservation', 'Chainlink Automation for decentralized execution', 'No centralized servers or custody'],
    },
    {
      title: 'Compliance Infrastructure',
      items: ['Universal metadata schema for multiple jurisdictions', 'Built-in category taxonomy (W2, 1099, contractor, invoice, vendor, grant)', 'Real-time dashboard and export capabilities'],
    },
  ];

  return (
    <section id="technology" className="py-20 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-semibold text-gray-900 mb-16">
          Built on modern Web3 infrastructure
        </h2>

        <div className="space-y-12">
          {layers.map((layer, index) => (
            <div key={index} className="border-t border-gray-200 pt-8">
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <h3 className="text-xl font-semibold text-gray-900">{layer.title}</h3>
                </div>
                <div className="lg:col-span-8">
                  <ul className="space-y-3">
                    {layer.items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
