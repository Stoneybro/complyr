// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/IntentRegistry.sol";
import "../src/SmartWallet.sol";
import "../src/SmartWalletFactory.sol";
import "../src/ComplianceRegistry.sol";
import "../src/MockUSDC.sol";

contract IntentRegistryTest is Test {
    IntentRegistry registry;
    SmartWalletFactory factory;
    SmartWallet implementation;
    ComplianceRegistry compliance;
    MockUSDC usdc;

    address owner = makeAddr("owner");
    address recipient1 = makeAddr("recipient1");
    address recipient2 = makeAddr("recipient2");

    function setUp() public {
        registry = new IntentRegistry(address(this));
        compliance = new ComplianceRegistry();
        
        implementation = new SmartWallet(address(registry), address(compliance));
        factory = new SmartWalletFactory(address(implementation), address(compliance));
        usdc = new MockUSDC();
        
        // Setup ComplianceRegistry
        compliance.setAuthorizedCaller(address(factory), true);
        compliance.setAuthorizedCaller(address(registry), true);
        compliance.setFactory(address(factory));

        registry.setComplianceRegistry(address(compliance));

        // Configure Factory Drip
        factory.setStablecoinDrip(address(usdc), 500 * 10**6);
        usdc.mint(address(factory), 10000 * 10**6);

        vm.label(address(registry), "IntentRegistry");
        vm.label(address(factory), "SmartWalletFactory");
        vm.label(address(compliance), "ComplianceRegistry");
        vm.label(address(usdc), "MockUSDC");
    }

    function test_CreateIntent() public {
        address walletAddr = factory.createSmartAccount(owner);
        SmartWallet wallet = SmartWallet(payable(walletAddr));
        
        // Give wallet some funds (500 USDC already dripped + extra)
        vm.deal(walletAddr, 1000 ether);

        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 1 ether;

        // Mock encrypted payload (now includes Reference IDs internally)
        bytes memory encryptedPayload = "mock_encrypted_payload_with_refs";

        vm.prank(walletAddr);
        bytes32 intentId = registry.createIntent(
            "Payroll",
            address(0), // token (ETH)
            recipients,
            amounts,
            1 days, // duration
            1 hours, // interval
            0, // start time (now)
            encryptedPayload
        );

        assertTrue(intentId != bytes32(0));
        
        // Check commitment (totalCommitment = (1+1) * (24 executions) = 48 ether)
        assertEq(wallet.sCommittedFunds(address(0)), 48 ether);

        // Check compliance record exists
        assertEq(compliance.getRecordCount(walletAddr), 1);
        
        // Verify payload is stored
        (,,,bytes memory storedPayload,) = compliance.getRecord(walletAddr, 0);
        assertEq(storedPayload, encryptedPayload);
    }

    function test_ExecuteIntentViaUpkeep() public {
        address walletAddr = factory.createSmartAccount(owner);
        vm.deal(walletAddr, 1000 ether);

        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 1 ether;

        // Mock encrypted payload
        bytes memory encryptedPayload = "mock_payload";

        vm.prank(walletAddr);
        registry.createIntent(
            "Payroll",
            address(0), // token (ETH)
            recipients,
            amounts,
            1 days, // duration
            1 hours, // interval
            0, // start time (now)
            encryptedPayload
        );

        // checkUpkeep should be true immediately for the first execution
        (bool upkeepNeeded, bytes memory performData) = registry.checkUpkeep("");
        assertTrue(upkeepNeeded);

        // performUpkeep
        registry.performUpkeep(performData);

        // Verify balances
        assertEq(recipient1.balance, 1 ether);
        assertEq(recipient2.balance, 1 ether);
        
        // verify commitment decreased (48 - 2 = 46)
        assertEq(SmartWallet(payable(walletAddr)).sCommittedFunds(address(0)), 46 ether);

        // checkUpkeep should be false now until interval passes
        (upkeepNeeded, ) = registry.checkUpkeep("");
        assertFalse(upkeepNeeded);

        // Time warp 1 hour
        vm.warp(block.timestamp + 1 hours + 1);
        (upkeepNeeded, ) = registry.checkUpkeep("");
        assertTrue(upkeepNeeded);
    }

    function test_CancelIntent() public {
        address walletAddr = factory.createSmartAccount(owner);
        vm.deal(walletAddr, 1000 ether);

        address[] memory recipients = new address[](1);
        recipients[0] = recipient1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;

        bytes memory encryptedPayload = "mock_payload";

        vm.prank(walletAddr);
        bytes32 intentId = registry.createIntent("Test", address(0), recipients, amounts, 10 hours, 1 hours, 0, encryptedPayload);

        assertEq(SmartWallet(payable(walletAddr)).sCommittedFunds(address(0)), 10 ether);

        // Cancel
        vm.prank(walletAddr);
        registry.cancelIntent(intentId);

        assertEq(SmartWallet(payable(walletAddr)).sCommittedFunds(address(0)), 0);
    }
}
