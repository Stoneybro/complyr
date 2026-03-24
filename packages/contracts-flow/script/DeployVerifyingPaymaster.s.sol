// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {VerifyingPaymaster} from "../src/VerifyingPaymaster.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract DeployVerifyingPaymaster is Script {
    /// @notice EntryPoint v0.7 address (same across all EVM chains)
    address constant ENTRYPOINT_V07 = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        // The verifying signer is the deployer by default
        // In production, this should be a dedicated backend signer address
        address verifyingSigner = msg.sender;

        vm.startBroadcast();

        VerifyingPaymaster paymaster = new VerifyingPaymaster(
            IEntryPoint(ENTRYPOINT_V07),
            verifyingSigner
        );

        // Deposit initial funds to the EntryPoint for gas sponsorship
        // The paymaster needs a deposit to cover gas costs for sponsored UserOps
        if (address(msg.sender).balance > 1 ether) {
            paymaster.deposit{value: 0.5 ether}();
            console.log("Deposited 0.5 ETH to EntryPoint for paymaster");
        }

        vm.stopBroadcast();

        console.log("VerifyingPaymaster deployed at:", address(paymaster));
        console.log("Verifying signer:", verifyingSigner);
        console.log("EntryPoint:", ENTRYPOINT_V07);
        console.log("Paymaster deposit:", paymaster.getDeposit());
    }
}
