// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MpSmartWallet} from "../src/MpSmartWallet.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployMpSmartWalletImplementation is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig = helperConfig.getConfig();
        vm.startBroadcast();
        MpSmartWallet wallet = new MpSmartWallet(networkConfig.registry);
        vm.stopBroadcast();
        console.log("Implementation Deployed at:", address(wallet));
    }
}
