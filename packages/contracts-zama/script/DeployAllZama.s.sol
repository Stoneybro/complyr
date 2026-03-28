// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ZamaHelperConfig} from "./ZamaHelperConfig.s.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {ComplianceReceiver} from "../src/ComplianceReceiver.sol";

/**
 * @title DeployAllZama
 * @notice Master deploy script for the Zama fhEVM (Sepolia) side.
 *         Deploys the Registry, Receiver, and wires them together.
 *
 * Usage:
 *   forge script script/DeployAllZama.s.sol:DeployAllZama \
 *     --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
 *     --account sepoliakey \
 *     --broadcast
 */
contract DeployAllZama is Script {
    function run() external {
        ZamaHelperConfig helperConfig = new ZamaHelperConfig();
        (address lzEndpoint, address owner) = helperConfig.activeNetworkConfig();

        vm.startBroadcast();

        // 1. Deploy the FHE Registry
        ComplianceRegistry registry = new ComplianceRegistry(owner);
        console.log("1. ComplianceRegistry: ", address(registry));

        // 2. Deploy the OApp Receiver
        ComplianceReceiver receiver = new ComplianceReceiver(
            lzEndpoint,
            owner,
            address(registry)
        );
        console.log("2. ComplianceReceiver: ", address(receiver));

        // 3. Authorize the Receiver on the Registry
        registry.setLzReceiver(address(receiver));
        console.log("3. Receiver authorized on Registry");

        vm.stopBroadcast();

        console.log("\n=== ZAMA DEPLOYMENT COMPLETE ===");
        console.log("ComplianceRegistry: ", address(registry));
        console.log("ComplianceReceiver: ", address(receiver));
        console.log("================================\n");
    }
}
