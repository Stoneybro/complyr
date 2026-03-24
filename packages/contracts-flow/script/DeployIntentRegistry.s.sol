// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {IntentRegistry} from "../src/IntentRegistry.sol";

contract DeployIntentRegistry is Script {
    function run() external {
        vm.startBroadcast();
        IntentRegistry registry = new IntentRegistry();
        vm.stopBroadcast();
        console.log("Intent Registry Deployed at:", address(registry));
    }
}
