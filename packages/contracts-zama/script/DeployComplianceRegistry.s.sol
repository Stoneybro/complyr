// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";

contract DeployComplianceRegistry is Script {
    function run() external {
        vm.startBroadcast();

        ComplianceRegistry registry = new ComplianceRegistry();

        vm.stopBroadcast();

        console.log("ComplianceRegistry deployed at:", address(registry));
        console.log("Owner:", registry.owner());
    }
}
