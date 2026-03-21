// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MpSmartWalletFactory} from "../src/MpSmartWalletFactory.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployMpSmartWalletFactory is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig = helperConfig.getConfig();
        vm.startBroadcast();
        MpSmartWalletFactory factory = new MpSmartWalletFactory(networkConfig.implementation);
        vm.stopBroadcast();
        console.log("Factory deployed to: ", address(factory));
        console.log("Implementation: ", networkConfig.implementation);
    }
}
