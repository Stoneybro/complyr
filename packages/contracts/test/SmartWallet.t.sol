// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SmartWallet.sol";
import "../src/SmartWalletFactory.sol";
import "../src/IAuditRegistry.sol";
import "encrypted-types/EncryptedTypes.sol";

contract MockWalletAuditRegistry is IAuditRegistry {
    mapping(address => address) public companyMasters;
    mapping(address => uint256) public recordCounts;

    function setAuthorizedCaller(address, bool) external {}
    function setFactory(address) external {}

    function registerAccount(address proxyAccount, address masterEOA) external {
        companyMasters[proxyAccount] = masterEOA;
    }

    function recordTransaction(
        bytes32,
        address proxyAccount,
        address,
        address[] calldata,
        externalEuint128[] calldata,
        bytes[] calldata,
        externalEuint8[] calldata,
        bytes[] calldata,
        externalEuint8[] calldata,
        bytes[] calldata,
        string[] calldata
    ) external {
        recordCounts[proxyAccount]++;
    }

    function getRecordCount(address proxyAccount) external view returns (uint256) {
        return recordCounts[proxyAccount];
    }
}

/**
 * @notice Unit tests for SmartWallet on Ethereum Sepolia.
 *         Uses a live AuditRegistry (deployed in setUp) instead of a bridge mock.
 */
contract SmartWalletTest is Test {
    SmartWallet implementation;
    SmartWallet wallet;
    SmartWalletFactory factory;
    MockWalletAuditRegistry registry;

    address owner = makeAddr("owner");
    address recipient = makeAddr("recipient");
    address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    address dummyRegistry = makeAddr("intentRegistry");

    function setUp() public {
        vm.label(entryPoint, "EntryPoint");
        vm.etch(dummyRegistry, "1");

        // Deploy the on-chain AuditRegistry
        registry = new MockWalletAuditRegistry();

        // Deploy SmartWallet implementation pointing to auditRegistry
        implementation = new SmartWallet(dummyRegistry, address(registry));

        // Deploy factory — also points to the AuditRegistry
        factory = new SmartWalletFactory(address(implementation), address(registry));

        // Authorize factory in AuditRegistry
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
        assertEq(wallet.AUDIT_REGISTRY(), address(registry));
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
        vm.expectRevert(SmartWallet.SmartWallet__AuditRequired.selector);
        wallet.execute(recipient, amount, "");
    }

    function test_CompliantNativeTransfer() public {
        uint256 amount = 1 ether;
        vm.deal(address(wallet), amount);

        vm.prank(owner);
        wallet.transferNativeWithAudit(
            keccak256("compliant-payment"),
            payable(recipient),
            amount,
            _mockAuditData(1)
        );

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
        vm.expectRevert(SmartWallet.SmartWallet__AuditRequired.selector);
        wallet.executeBatch(calls);
    }

    function test_CompliantNativeBatchTransfer() public {
        address recipient2 = makeAddr("recipient2");
        uint256 amount1 = 1 ether;
        uint256 amount2 = 2 ether;
        vm.deal(address(wallet), amount1 + amount2);

        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(recipient);
        recipients[1] = payable(recipient2);

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = amount1;
        amounts[1] = amount2;

        vm.prank(owner);
        wallet.batchTransferNativeWithAudit(
            keccak256("compliant-batch"),
            recipients,
            amounts,
            _mockAuditData(2)
        );

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

    function test_RecordAudit() public {
        address[] memory recipients = new address[](1);
        recipients[0] = recipient;
        externalEuint128[] memory encryptedAmountHandles = new externalEuint128[](1);
        bytes[] memory encryptedAmountProofs = new bytes[](1);
        externalEuint8[] memory encryptedCategoryHandles = new externalEuint8[](1);
        bytes[] memory encryptedCategoryProofs = new bytes[](1);
        externalEuint8[] memory encryptedJurisdictionHandles = new externalEuint8[](1);
        bytes[] memory encryptedJurisdictionProofs = new bytes[](1);
        string[] memory referenceIds = new string[](1);
        referenceIds[0] = "test-payment-1";

        bytes32 txHash = keccak256("test-payment-1");

        vm.prank(owner);
        wallet.recordAudit(
            txHash,
            address(0),
            recipients,
            encryptedAmountHandles,
            encryptedAmountProofs,
            encryptedCategoryHandles,
            encryptedCategoryProofs,
            encryptedJurisdictionHandles,
            encryptedJurisdictionProofs,
            referenceIds
        );

        assertEq(registry.getRecordCount(address(wallet)), 1);
    }

    function _mockAuditData(uint256 length) internal pure returns (SmartWallet.AuditData memory auditData) {
        auditData.amountHandles = new externalEuint128[](length);
        auditData.amountProofs = new bytes[](length);
        auditData.categoryHandles = new externalEuint8[](length);
        auditData.categoryProofs = new bytes[](length);
        auditData.jurisdictionHandles = new externalEuint8[](length);
        auditData.jurisdictionProofs = new bytes[](length);
        auditData.referenceIds = new string[](length);

        for (uint256 i; i < length; i++) {
            auditData.referenceIds[i] = "ref";
        }
    }
}
