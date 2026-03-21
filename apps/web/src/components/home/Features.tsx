import { MessageSquare, Users, Split, Shield, RefreshCw } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Jurisdiction-Aware Payment Definition',
      description: 'Define complex cross-border payment workflows using natural language with automatic compliance tagging.',
      details: 'MantlePay extracts recipients, amounts, jurisdiction codes, and tax categories—then generates compliant on-chain payment logic.',
      examples: [
        'Pay my California W2 employees Alice and Bob $5000 each biweekly',
        'Send contractor payment to UK-based developer £3000 monthly',
        'Process invoice payment to Nigerian vendor ₦500,000',
      ],
      value: 'Complex multi-jurisdiction payroll from a single instruction with compliance metadata baked in.',
    },
    {
      icon: Shield,
      title: 'Universal Compliance Metadata',
      description: 'Every payment includes jurisdiction-aware tracking for tax reporting and audit requirements.',
      details: 'Built-in support for: Tax categories (W2, 1099, contractor), Jurisdiction codes (US-CA, UK, EU-DE), Period identifiers, and Entity IDs.',
      value: 'Turn every payment into a compliance-ready data point. No manual categorization, no spreadsheet reconciliation.',
    },
    {
      icon: Users,
      title: 'Native Batch & Split Payments',
      description: 'Execute multi-recipient payouts with jurisdiction-specific metadata in a single transaction.',
      details: 'Batch execution built into the smart account. Each recipient can have different tax categories and jurisdictions. No external multisend contracts.',
      value: 'Process entire global payroll runs in one transaction with per-recipient compliance data.',
    },
    {
      icon: Split,
      title: 'Automated Compliance Reporting',
      description: 'Real-time compliance dashboard with jurisdiction-filtered views and one-click CSV exports.',
      details: 'Filter payments by jurisdiction, tax category, or time period. Export audit-ready CSV files for accountants.',
      value: 'Generate tax reports and audit documentation in seconds, not hours. Built-in compliance from day one.',
    },
    {
      icon: RefreshCw,
      title: 'Decentralized Payment Automation',
      description: 'Recurring payment schedules execute automatically using Chainlink Automation with full compliance tracking.',
      details: 'No centralized servers required. Jurisdiction and category metadata preserved across all executions.',
      value: 'True set-and-forget global payroll with compliance baked into every automated payment.',
    },
  ];

  return (
    <section id="features" className="py-20 px-6 lg:px-8 ">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl font-semibold text-gray-900 mb-6">
            Built for compliant automated payments across jurisdictions
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            MantlePay combines AI-powered payment parsing, smart account infrastructure, and compliance-first design to handle payroll, contractor payments, and vendor invoices as first-class on-chain workflows.
          </p>
        </div>

        <div className="space-y-12">
          {features.map((feature, index) => (
            <div key={index} className="border-t border-gray-200 pt-12">
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                  <feature.icon className="w-8 h-8 text-gray-900 mb-4" strokeWidth={1.5} />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <p className="text-gray-700">{feature.details}</p>

                  {feature.examples && (
                    <div className="space-y-3 py-4">
                      <p className="text-sm font-medium text-gray-900">Examples</p>
                      {feature.examples.map((example, i) => (
                        <div key={i} className="border-l-2 border-gray-300 pl-4">
                          <p className="text-sm text-gray-600">{example}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-sm font-medium text-gray-900">Value</p>
                    <p className="text-sm text-gray-600">{feature.value}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
