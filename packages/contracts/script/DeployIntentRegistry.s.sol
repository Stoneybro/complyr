// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {IntentRegistry} from "../src/IntentRegistry.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployIntentRegistry is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        vm.startBroadcast();
        IntentRegistry registry = new IntentRegistry(config.owner);
        vm.stopBroadcast();
        console.log("Intent Registry Deployed at:", address(registry));
    }
}
