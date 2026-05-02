import { privateKeyToAccount } from "viem/accounts";
console.log("Relayer (Ethereum Sepolia):", privateKeyToAccount("0x327672ce2f423197aa9dcf528b9688fb9ef6dcfa340cdcadb9f119157538bef6").address);
console.log("Bundler (Ethereum Sepolia):", privateKeyToAccount("0x01e0bf2f44785d423f9bfe5f4b505e1a8d83426d3e531cc7b4291af038dd2c62").address);
