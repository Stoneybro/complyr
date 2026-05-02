
import { createPublicClient, createWalletClient, http, parseAbi, zeroAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';


if (!process.env.PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY is missing in .env file');
    console.error('   Please create a .env file in packages/keeper/ with PRIVATE_KEY=0x...');
    process.exit(1);
}

let privateKey = process.env.PRIVATE_KEY.trim();

// Auto-fix missing 0x prefix
if (!privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`;
    console.log('ℹ️  Added missing "0x" prefix to private key.');
}

// Basic validation for hex string length (64 chars + 2 for 0x = 66)
if (privateKey.length !== 66) {
    console.error(`❌ Error: Invalid private key length (${privateKey.length}).`);
    console.error('   Expected 66 characters (including 0x prefix).');
    console.error('   Ensure there are no extra spaces or newline characters.');
    process.exit(1);
}

const PRIVATE_KEY = privateKey as `0x${string}`;

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL)
});

const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL)
});

const REGISTRY_ADDRESS = (process.env.INTENT_REGISTRY_ADDRESS || zeroAddress) as `0x${string}`;

// Minimal ABI for automation
const ABI = parseAbi([
    'function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData)',
    'function performUpkeep(bytes calldata performData) external',
    'function getRegisteredWalletsCount() external view returns (uint256)'
]);

async function main() {
    console.log(`🚀 Starting Keeper Service...`);
    console.log(`   Wallet: ${account.address}`);
    console.log(`   Registry: ${REGISTRY_ADDRESS}`);
    console.log(`   RPC: ${RPC_URL}`);

    // If running on Render as a Web Service, we MUST bind to a port
    // otherwise Render will fail the health check and kill the process.
    const port = process.env.PORT;
    if (port) {
        const http = await import('http');
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Complyr Keeper is running!\\n');
        });
        server.listen(port, () => {
            console.log(`🌐 Dummy Web Server listening on port ${port} for Render Health Checks`);
        });
    }

    // Poll every 12 seconds
    setInterval(checkAndExecute, 12000);

    // Run immediately on start
    await checkAndExecute();
}

async function checkAndExecute() {
    try {
        const blockNumber = await publicClient.getBlockNumber();
        console.log(`[${new Date().toLocaleTimeString()}] 🔍 Checking Block: ${blockNumber}`);

        // Diagnostic: Check global state
        const registeredCount = await publicClient.readContract({
            address: REGISTRY_ADDRESS,
            abi: ABI,
            functionName: 'getRegisteredWalletsCount'
        }) as bigint;

        console.log(`   📊 Registry State: ${registeredCount} registered wallets`);

        const [upkeepNeeded, performData] = await publicClient.readContract({
            address: REGISTRY_ADDRESS,
            abi: ABI,
            functionName: 'checkUpkeep',
            args: ['0x']
        }) as [boolean, `0x${string}`];

        if (upkeepNeeded) {
            console.log(`✅ Upkeep needed! Executing transaction...`);

            const hash = await walletClient.writeContract({
                address: REGISTRY_ADDRESS,
                abi: ABI,
                functionName: 'performUpkeep',
                args: [performData]
            });

            console.log(`🎉 Transaction sent: ${hash}`);
            console.log(`   Waiting for confirmation...`);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            if (receipt.status === 'success') {
                console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
            } else {
                console.error(`❌ Transaction failed!`);
            }

        } else {
            console.log(`zzz No upkeep needed.`);
        }

    } catch (error) {
        console.error('❌ Error in keeper loop:', error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
