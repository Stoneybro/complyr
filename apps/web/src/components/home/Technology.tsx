import React from 'react';

const stack = [
  { name: 'Base', role: 'Settlement' },
  { name: 'Chainlink', role: 'Automation' },
  { name: 'AES-256', role: 'Client Encryption' },
  { name: 'Envio', role: 'Data Indexing' },
  { name: 'ERC-4337', role: 'Account Abstraction' },
  { name: 'Custom Keepers', role: 'Automated Execution' },
];

export default function Technology() {
  return (
    <section className="py-32 px-6 md:px-12 bg-surface-container-low border-t border-outline-variant/30">
      <div className="max-w-6xl mx-auto">
        <div className="mb-24 flex items-center gap-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline">The stack</span>
          <div className="flex-grow h-px bg-outline-variant/30"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 text-center">
          {stack.map((item, i) => (
            <div 
              key={item.name} 
              className="flex flex-col items-center"
            >
              <div className="font-mono text-xs mb-4 p-2 bg-surface border border-outline-variant/50 w-full uppercase">{item.name}</div>
              <p className="text-[10px] uppercase tracking-widest leading-relaxed opacity-50">{item.role}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-24 p-12 border border-primary bg-surface relative">
          <div className="absolute -top-3 left-8 bg-surface px-4 text-[10px] font-bold uppercase tracking-widest">Protocol Schema</div>
          <div className="flex justify-between border-b border-outline-variant/50 pb-4 mb-8">
            <span className="font-mono text-[0.6875rem] text-on-surface">COMPLIANCE_PAYLOAD.JSON</span>
            <span className="font-mono text-[0.6875rem] text-outline">v0.2.0-beta</span>
          </div>
          <pre className="font-mono text-[0.75rem] text-on-surface-variant overflow-x-auto leading-relaxed">{`{
  "intent": {
    "to": "0x7a58c0be72ND...",
    "value": "5000000000",
    "token": "USDC"
  },
  "compliance": {
    "aes_encrypted_metadata": "0x000000002194b8e...",
    "signature": "0x4b7c...",
    "verification_status": "SECURED_ONCHAIN"
  }
}`}</pre>
        </div>
      </div>
    </section>
  );
}
