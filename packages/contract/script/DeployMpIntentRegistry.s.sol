// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MpIntentRegistry} from "../src/MpIntentRegistry.sol";

contract DeployMpIntentRegistry is Script {
    function run() external {
        vm.startBroadcast();
        MpIntentRegistry registry = new MpIntentRegistry();
        vm.stopBroadcast();
        console.log("Intent Registry Deployed at:", address(registry));
    }
}
