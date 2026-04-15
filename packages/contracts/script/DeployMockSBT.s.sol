// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockSBT} from "../src/MockSBT.sol";

/**
 * @title DeployMockSBT
 * @notice Deploys the MockSBT contract used by Complyr's KYC demo on HashKey testnet.
 *
 * Usage:
 *   forge script script/DeployMockSBT.s.sol \
 *     --rpc-url https://testnet.hsk.xyz \
 *     --private-key $RELAY_PRIVATE_KEY \
 *     --broadcast \
 *     -vvvv
 *
 * After deploying, update HASHKEY_KYC_SBT in apps/web/src/lib/CA.ts with the
 * printed contract address.
 */
contract DeployMockSBT is Script {
    function run() external {
        vm.startBroadcast();

        MockSBT sbt = new MockSBT();

        vm.stopBroadcast();

        console.log("=== MockSBT Deployed ===");
        console.log("Address:  ", address(sbt));
        console.log("Owner:    ", sbt.owner());
        console.log("");
        console.log("Update apps/web/src/lib/CA.ts:");
        console.log("  HASHKEY_KYC_SBT =", address(sbt));
        console.log("========================");
    }
}
