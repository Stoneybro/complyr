#!/bin/sh
cat > /usr/app/config.json << CONF
{
  "entryPoints": ["0x0000000071727De22E5E9d8BAf0edAc6f37da032"],
  "relayers": ["${MNEMONIC}"],
  "rpcEndpoint": "https://testnet.evm.nodes.onflow.org",
  "chainId": 545,
  "vglMarkup": 60000,
  "cglMarkup": 150000
}
CONF
node ./packages/cli/bin/skandha.js standalone
