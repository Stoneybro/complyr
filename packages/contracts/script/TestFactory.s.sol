// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SmartWalletFactory.sol";
import "../src/SmartWallet.sol";

contract TestFactory is Script {
    function run() external {
        address deployer = address(0x123);
        vm.startBroadcast(deployer);

        // We can pass a dummy address for the compliance bridge since it's commented out
        address dummyBridge = address(0xABC);

        SmartWallet implementation = new SmartWallet(0x0000000071727De22E5E9d8BAf0edAc6f37da032, dummyBridge);
        
        // Ensure the dummy bridge has some code so the constructor check passes
        vm.etch(dummyBridge, hex"00");

        SmartWalletFactory factory = new SmartWalletFactory(address(implementation), dummyBridge);

        // Try creating an account
        address owner = address(0x456);
        address account = factory.createSmartAccount(owner);
        
        console.log("Deployed account at:", account);

        vm.stopBroadcast();
    }
}
