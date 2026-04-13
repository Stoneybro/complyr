// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {SmartWalletFactory} from "../src/SmartWalletFactory.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeploySmartWalletFactory is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig = helperConfig.getConfig();
        vm.startBroadcast();
        SmartWalletFactory factory = new SmartWalletFactory(networkConfig.implementation, networkConfig.complianceRegistry);
        vm.stopBroadcast();
        console.log("Factory deployed to: ", address(factory));
        console.log("Implementation: ", networkConfig.implementation);
    }
}
