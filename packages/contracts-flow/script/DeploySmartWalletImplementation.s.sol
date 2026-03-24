// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {SmartWallet} from "../src/SmartWallet.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeploySmartWalletImplementation is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig = helperConfig.getConfig();
        vm.startBroadcast();
        SmartWallet wallet = new SmartWallet(networkConfig.registry);
        vm.stopBroadcast();
        console.log("Implementation Deployed at:", address(wallet));
    }
}
