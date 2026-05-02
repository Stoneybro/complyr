// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

import {IntentRegistry} from "../src/IntentRegistry.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {SmartWallet} from "../src/SmartWallet.sol";
import {SmartWalletFactory} from "../src/SmartWalletFactory.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/**
 * @title DeployAll
 * @notice Master deploy script for Complyr on Ethereum Sepolia.
 */
contract DeployAll is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        vm.startBroadcast();

        // ── Phase 1: Core Registries ─────────────────────────────────────────

        IntentRegistry intentRegistry = new IntentRegistry(config.owner);
        console.log("1. IntentRegistry:       ", address(intentRegistry));

        ComplianceRegistry complianceRegistry = new ComplianceRegistry();
        console.log("2. ComplianceRegistry:   ", address(complianceRegistry));

        // ── Phase 2: Mock Stablecoin (for Hackathon Demo) ────────────────────

        MockUSDC usdc = new MockUSDC();
        console.log("3. MockUSDC:             ", address(usdc));

        // ── Phase 3: Smart Wallet Implementation ─────────────────────────────

        SmartWallet implementation = new SmartWallet(
            address(intentRegistry), 
            address(complianceRegistry)
        );
        console.log("4. SmartWallet Impl:     ", address(implementation));

        // ── Phase 4: Factory ─────────────────────────────────────────────────

        SmartWalletFactory factory = new SmartWalletFactory(
            address(implementation), 
            address(complianceRegistry)
        );
        console.log("5. SmartWalletFactory:   ", address(factory));

        // ── Phase 5: Wire & Fund ─────────────────────────────────────────────

        // Authorize IntentRegistry in ComplianceRegistry
        complianceRegistry.setAuthorizedCaller(address(intentRegistry), true);
        
        // Set ComplianceRegistry in IntentRegistry
        intentRegistry.setComplianceRegistry(address(complianceRegistry));

        // Set Factory in ComplianceRegistry
        complianceRegistry.setFactory(address(factory));

        // Configure Factory Drip: 500 USDC
        uint256 stableDrip = 500 * 10**6; // 6 decimals
        factory.setStablecoinDrip(address(usdc), stableDrip);
        console.log("-> Configured 500 USDC drip in Factory");

        // Fund Factory with Mock USDC
        usdc.mint(address(factory), 1_000_000 * 10**6);
        console.log("-> Funded Factory with 1M Mock USDC");

        // Native token drip funding handled separately for Ethereum Sepolia if needed.

        vm.stopBroadcast();

        // ── Summary ───────────────────────────────────────────────────────────
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("MockUSDCAddress:          ", address(usdc));
        console.log("IntentRegistryAddress:    ", address(intentRegistry));
        console.log("ComplianceRegistryAddress:", address(complianceRegistry));
        console.log("SmartWalletImplAddress:   ", address(implementation));
        console.log("SmartWalletFactoryAddress:", address(factory));
        console.log("===========================");
    }
}
