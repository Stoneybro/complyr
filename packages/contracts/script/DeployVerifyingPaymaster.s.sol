// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {VerifyingPaymaster} from "../src/VerifyingPaymaster.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployVerifyingPaymaster is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        vm.startBroadcast();

        VerifyingPaymaster paymaster = new VerifyingPaymaster(
            IEntryPoint(config.entryPoint),
            config.verifyingSigner
        );

        // Deposit initial funds to the EntryPoint for gas sponsorship
        // The paymaster needs a deposit to cover gas costs for sponsored UserOps
        if (address(msg.sender).balance > 5 ether) {
            paymaster.deposit{value: 5 ether}();
            console.log("Deposited 5 ETH to EntryPoint for paymaster");
        }

        vm.stopBroadcast();

        console.log("VerifyingPaymaster deployed at:", address(paymaster));
        console.log("Verifying signer:", config.verifyingSigner);
        console.log("EntryPoint:", config.entryPoint);
        console.log("Paymaster deposit:", paymaster.getDeposit());
    }
}
