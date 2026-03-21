const useCases = [
  {
    title: "Multi-Jurisdiction Payroll",
    instruction: "Run monthly payroll: Alice and Bob in California W2 $6000 each, Charlie in UK contractor £4000, Dayo in Nigeria contractor ₦800,000",
    outcomes: [
      "Automatic jurisdiction tagging",
      "Correct tax categories applied",
      "One export with breakdowns",
    ],
  },
  {
    title: "Quarterly Contractor Payments",
    instruction: "Pay 1099 contractors quarterly: 10 US-based developers $15,000 each for Q1 2025",
    outcomes: [
      "Category: PAYROLL_1099",
      "Immutable record for IRS",
      "One-click 1099-ready CSV",
    ],
  },
  {
    title: "International Vendor Invoices",
    instruction: "Process monthly invoices: UK hosting provider £500, Nigerian design agency ₦200,000, German legal services €2000",
    outcomes: [
      "Link to invoice numbers",
      "Filtered by vendor type",
      "Complete international audit trail",
    ],
  },
];

export default function UseCases() {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">Real compliance scenarios solved by MantlePay</h2>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-background rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4">{useCase.title}</h3>

              <div className="mb-6">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Instruction</span>
                <p className="text-sm italic text-muted-foreground mt-1">"{useCase.instruction}"</p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Outcome</span>
                <ul className="mt-2 space-y-2">
                  {useCase.outcomes.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
