// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SmartWallet.sol";
import "../src/SmartWalletFactory.sol";
import "../src/ComplianceRegistry.sol";

/**
 * @notice Unit tests for SmartWallet on Ethereum Sepolia.
 *         Uses a live ComplianceRegistry (deployed in setUp) instead of a bridge mock.
 */
contract SmartWalletTest is Test {
    SmartWallet implementation;
    SmartWallet wallet;
    SmartWalletFactory factory;
    ComplianceRegistry registry;

    address owner = makeAddr("owner");
    address recipient = makeAddr("recipient");
    address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    address dummyRegistry = makeAddr("intentRegistry");

    function setUp() public {
        vm.label(entryPoint, "EntryPoint");
        vm.etch(dummyRegistry, "1");

        // Deploy the on-chain ComplianceRegistry
        registry = new ComplianceRegistry();

        // Deploy SmartWallet implementation pointing to complianceRegistry
        implementation = new SmartWallet(dummyRegistry, address(registry));

        // Deploy factory — also points to the ComplianceRegistry
        factory = new SmartWalletFactory(address(implementation), address(registry));

        // Authorize factory in ComplianceRegistry
        registry.setFactory(address(factory));
        registry.setAuthorizedCaller(dummyRegistry, true); // Authorize dummy intent registry

        // Fund factory for drip and deploy wallet for owner
        vm.deal(address(factory), 100 ether);
        vm.prank(owner);
        address account = factory.createSmartAccount(owner);
        wallet = SmartWallet(payable(account));
    }

    function test_Initialization() public view {
        assertEq(wallet.sOwner(), owner);
        assertEq(wallet.INTENT_REGISTRY(), dummyRegistry);
        assertEq(wallet.COMPLIANCE_REGISTRY(), address(registry));
    }

    function test_RegistryRegistration() public view {
        // Factory should have auto-registered the wallet during createSmartAccount
        assertEq(registry.companyMasters(address(wallet)), owner);
    }

    function test_CannotReinitialize() public {
        vm.expectRevert();
        wallet.initialize(makeAddr("newOwner"));
    }

    function test_ReceiveETH() public {
        uint256 amount = 1 ether;
        vm.deal(address(this), amount);
        (bool success, ) = address(wallet).call{value: amount}("");
        assertTrue(success);
        assertEq(address(wallet).balance, amount + 0.01 ether); // 0.01 ether from factory drip
    }

    function test_ExecuteSingle() public {
        uint256 amount = 1 ether;
        vm.deal(address(wallet), amount);

        vm.prank(owner);
        wallet.execute(recipient, amount, "");

        assertEq(recipient.balance, amount);
    }

    function test_ExecuteBatch() public {
        address recipient2 = makeAddr("recipient2");
        uint256 amount1 = 1 ether;
        uint256 amount2 = 2 ether;
        vm.deal(address(wallet), amount1 + amount2);

        SmartWallet.Call[] memory calls = new SmartWallet.Call[](2);
        calls[0] = SmartWallet.Call({target: recipient, value: amount1, data: ""});
        calls[1] = SmartWallet.Call({target: recipient2, value: amount2, data: ""});

        vm.prank(owner);
        wallet.executeBatch(calls);

        assertEq(recipient.balance, amount1);
        assertEq(recipient2.balance, amount2);
    }

    function test_UnauthorizedExecute() public {
        vm.prank(makeAddr("attacker"));
        vm.expectRevert(SmartWallet.SmartWallet__Unauthorized.selector);
        wallet.execute(recipient, 1 ether, "");
    }

    function test_SignatureValidation() public {
        uint256 privateKey = 0x123;
        address signer = vm.addr(privateKey);

        vm.prank(signer);
        address account = factory.createSmartAccount(signer);
        SmartWallet signWallet = SmartWallet(payable(account));

        bytes32 messageHash = keccak256("hello");
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        bytes4 magicValue = signWallet.isValidSignature(messageHash, signature);
        assertEq(magicValue, bytes4(0x1626ba7e));
    }

    function test_RecordCompliance() public {
        address[] memory recipients = new address[](1);
        recipients[0] = recipient;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1e6; // 1 USDC
        bytes memory encryptedPayload = hex"deadbeef"; // mock ciphertext

        bytes32 txHash = keccak256("test-payment-1");

        vm.prank(owner);
        wallet.recordCompliance(txHash, recipients, amounts, encryptedPayload);

        assertEq(registry.getRecordCount(address(wallet)), 1);
    }
}
