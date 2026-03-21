export default function WhyTeams() {
  const reasons = [
    'Compliance-first by design: Jurisdiction and tax data are native, not bolted on',
    'Audit-ready from day one: Immutable on-chain records with full metadata',
    'Built for global operations: Multi-jurisdiction support across US, UK, EU, Africa',
    'Accountant-friendly: CSV exports match existing tax reporting workflows',
  ];

  return (
    <section className="py-20 px-6 lg:px-8 ">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-semibold text-gray-900 mb-6">
            Why compliance-focused teams choose MantlePay
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Traditional wallets require manual tracking. MantlePay automates compliance at the infrastructure level.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {reasons.map((reason, index) => (
              <div key={index} className="border-l-2 border-gray-900 pl-4">
                <p className="text-gray-900 font-medium">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
