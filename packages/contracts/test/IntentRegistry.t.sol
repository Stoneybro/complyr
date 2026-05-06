// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/IntentRegistry.sol";
import "../src/SmartWallet.sol";
import "../src/SmartWalletFactory.sol";
import "../src/IAuditRegistry.sol";
import "../src/MockUSDC.sol";
import "encrypted-types/EncryptedTypes.sol";

contract MockAuditRegistry is IAuditRegistry {
    mapping(address => address) public companyMasters;
    mapping(address => uint256) public recordCounts;
    mapping(address => address[]) private _recipients;
    mapping(address => string[]) private _referenceIds;
    mapping(address => address) private _tokens;

    function setAuthorizedCaller(address, bool) external {}
    function setFactory(address) external {}

    function registerAccount(address proxyAccount, address masterEOA) external {
        companyMasters[proxyAccount] = masterEOA;
    }

    function recordTransaction(
        bytes32,
        address proxyAccount,
        address token,
        address[] calldata recipients,
        externalEuint128[] calldata,
        bytes[] calldata,
        externalEuint8[] calldata,
        bytes[] calldata,
        externalEuint8[] calldata,
        bytes[] calldata,
        string[] calldata referenceIds
    ) external {
        recordCounts[proxyAccount]++;
        _tokens[proxyAccount] = token;
        _recipients[proxyAccount] = recipients;
        _referenceIds[proxyAccount] = referenceIds;
    }

    function getRecordCount(address proxyAccount) external view returns (uint256) {
        return recordCounts[proxyAccount];
    }

    function getRecordMetadata(address proxyAccount, uint256)
        external
        view
        returns (bytes32, address, address[] memory, string[] memory, uint256)
    {
        return (bytes32(0), _tokens[proxyAccount], _recipients[proxyAccount], _referenceIds[proxyAccount], block.timestamp);
    }
}

contract IntentRegistryTest is Test {
    IntentRegistry registry;
    SmartWalletFactory factory;
    SmartWallet implementation;
    MockAuditRegistry audit;
    MockUSDC usdc;

    address owner = makeAddr("owner");
    address recipient1 = makeAddr("recipient1");
    address recipient2 = makeAddr("recipient2");

    function setUp() public {
        registry = new IntentRegistry(address(this));
        audit = new MockAuditRegistry();
        
        implementation = new SmartWallet(address(registry), address(audit));
        factory = new SmartWalletFactory(address(implementation), address(audit));
        usdc = new MockUSDC();
        
        // Setup AuditRegistry
        audit.setAuthorizedCaller(address(factory), true);
        audit.setAuthorizedCaller(address(registry), true);
        audit.setFactory(address(factory));

        registry.setAuditRegistry(address(audit));

        // Configure Factory Drip
        factory.setStablecoinDrip(address(usdc), 500 * 10**6);
        usdc.mint(address(factory), 10000 * 10**6);

        vm.label(address(registry), "IntentRegistry");
        vm.label(address(factory), "SmartWalletFactory");
        vm.label(address(audit), "AuditRegistry");
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

        (
            externalEuint128[] memory encryptedAmountHandles,
            bytes[] memory encryptedAmountProofs,
            externalEuint8[] memory encryptedCategoryHandles,
            bytes[] memory encryptedCategoryProofs,
            externalEuint8[] memory encryptedJurisdictionHandles,
            bytes[] memory encryptedJurisdictionProofs,
            string[] memory referenceIds
        ) = _mockAuditInputs(recipients.length);

        vm.prank(walletAddr);
        bytes32 intentId = registry.createIntent(
            "Payroll",
            address(0), // token (ETH)
            recipients,
            amounts,
            1 days, // duration
            1 hours, // interval
            0, // start time (now)
            encryptedAmountHandles,
            encryptedAmountProofs,
            encryptedCategoryHandles,
            encryptedCategoryProofs,
            encryptedJurisdictionHandles,
            encryptedJurisdictionProofs,
            referenceIds
        );

        assertTrue(intentId != bytes32(0));
        
        // Check commitment (totalCommitment = (1+1) * (24 executions) = 48 ether)
        assertEq(wallet.sCommittedFunds(address(0)), 48 ether);

        // Check audit record exists
        assertEq(audit.getRecordCount(walletAddr), 1);
        
        // Verify metadata is stored
        (, address token, address[] memory storedRecipients, string[] memory storedRefs,) =
            audit.getRecordMetadata(walletAddr, 0);
        assertEq(token, address(0));
        assertEq(storedRecipients.length, recipients.length);
        assertEq(storedRefs[0], "ref-0");
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

        (
            externalEuint128[] memory encryptedAmountHandles,
            bytes[] memory encryptedAmountProofs,
            externalEuint8[] memory encryptedCategoryHandles,
            bytes[] memory encryptedCategoryProofs,
            externalEuint8[] memory encryptedJurisdictionHandles,
            bytes[] memory encryptedJurisdictionProofs,
            string[] memory referenceIds
        ) = _mockAuditInputs(recipients.length);

        vm.prank(walletAddr);
        registry.createIntent(
            "Payroll",
            address(0), // token (ETH)
            recipients,
            amounts,
            1 days, // duration
            1 hours, // interval
            0, // start time (now)
            encryptedAmountHandles,
            encryptedAmountProofs,
            encryptedCategoryHandles,
            encryptedCategoryProofs,
            encryptedJurisdictionHandles,
            encryptedJurisdictionProofs,
            referenceIds
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

        (
            externalEuint128[] memory encryptedAmountHandles,
            bytes[] memory encryptedAmountProofs,
            externalEuint8[] memory encryptedCategoryHandles,
            bytes[] memory encryptedCategoryProofs,
            externalEuint8[] memory encryptedJurisdictionHandles,
            bytes[] memory encryptedJurisdictionProofs,
            string[] memory referenceIds
        ) = _mockAuditInputs(recipients.length);

        vm.prank(walletAddr);
        bytes32 intentId = registry.createIntent(
            "Test",
            address(0),
            recipients,
            amounts,
            10 hours,
            1 hours,
            0,
            encryptedAmountHandles,
            encryptedAmountProofs,
            encryptedCategoryHandles,
            encryptedCategoryProofs,
            encryptedJurisdictionHandles,
            encryptedJurisdictionProofs,
            referenceIds
        );

        assertEq(SmartWallet(payable(walletAddr)).sCommittedFunds(address(0)), 10 ether);

        // Cancel
        vm.prank(walletAddr);
        registry.cancelIntent(intentId);

        assertEq(SmartWallet(payable(walletAddr)).sCommittedFunds(address(0)), 0);
    }

    function _mockAuditInputs(uint256 length)
        internal
        pure
        returns (
            externalEuint128[] memory encryptedAmountHandles,
            bytes[] memory encryptedAmountProofs,
            externalEuint8[] memory encryptedCategoryHandles,
            bytes[] memory encryptedCategoryProofs,
            externalEuint8[] memory encryptedJurisdictionHandles,
            bytes[] memory encryptedJurisdictionProofs,
            string[] memory referenceIds
        )
    {
        encryptedAmountHandles = new externalEuint128[](length);
        encryptedAmountProofs = new bytes[](length);
        encryptedCategoryHandles = new externalEuint8[](length);
        encryptedCategoryProofs = new bytes[](length);
        encryptedJurisdictionHandles = new externalEuint8[](length);
        encryptedJurisdictionProofs = new bytes[](length);
        referenceIds = new string[](length);

        for (uint256 i; i < length; i++) {
            encryptedAmountProofs[i] = "";
            encryptedCategoryProofs[i] = "";
            encryptedJurisdictionProofs[i] = "";
            referenceIds[i] = i == 0 ? "ref-0" : "ref-1";
        }
    }
}
