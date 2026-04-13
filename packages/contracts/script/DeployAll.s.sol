// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

import {IntentRegistry} from "../src/IntentRegistry.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {SmartWallet} from "../src/SmartWallet.sol";
import {SmartWalletFactory} from "../src/SmartWalletFactory.sol";
import {VerifyingPaymaster} from "../src/VerifyingPaymaster.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/**
 * @title DeployAll
 * @notice Master deploy script for Complyr on HashKey Chain.
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

        // ── Phase 5: Verifying Paymaster ─────────────────────────────────────

        VerifyingPaymaster paymaster = new VerifyingPaymaster(
            IEntryPoint(config.entryPoint),
            config.verifyingSigner
        );
        console.log("6. VerifyingPaymaster:   ", address(paymaster));

        // ── Phase 6: Wire & Fund ─────────────────────────────────────────────

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

        // Optional: Fund the paymaster and factory with native HSK for gas
        if (address(this).balance > 0.3 ether) {
            paymaster.deposit{value: 0.1 ether}();
            console.log("-> Paymaster funded with 0.1 HSK");
            
            // Fund factory for 0.01 HSK drips (covers 10 users)
            (bool success, ) = address(factory).call{value: 0.1 ether}("");
            if (success) {
                console.log("-> Factory funded with 0.1 HSK for native drips");
            }
        }

        vm.stopBroadcast();

        // ── Summary ───────────────────────────────────────────────────────────
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("MockUSDCAddress:          ", address(usdc));
        console.log("IntentRegistryAddress:    ", address(intentRegistry));
        console.log("ComplianceRegistryAddress:", address(complianceRegistry));
        console.log("SmartWalletImplAddress:   ", address(implementation));
        console.log("SmartWalletFactoryAddress:", address(factory));
        console.log("VerifyingPaymasterAddress:", address(paymaster));
        console.log("===========================");
    }
}
