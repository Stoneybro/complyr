// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SmartWalletFactory.sol";
import "../src/SmartWallet.sol";
import "../src/AuditRegistry.sol";
import "../src/MockUSDC.sol";

contract SmartWalletFactoryTest is Test {
    SmartWalletFactory factory;
    SmartWallet implementation;
    AuditRegistry registry;
    MockUSDC usdc;
    address dummyIntentRegistry = address(0x1111);

    function setUp() public {
        vm.etch(dummyIntentRegistry, "1");

        registry = new AuditRegistry();
        implementation = new SmartWallet(dummyIntentRegistry, address(registry));
        factory = new SmartWalletFactory(address(implementation), address(registry));
        usdc = new MockUSDC();

        // Set factory in AuditRegistry
        registry.setFactory(address(factory));
        
        // Configure Factory Drip
        factory.setStablecoinDrip(address(usdc), 500 * 10**6);
        usdc.mint(address(factory), 1000 * 10**6);
    }

    function test_CreateSmartAccountWithDrips() public {
        address owner = makeAddr("owner");
        vm.deal(address(factory), 1 ether);

        address account = factory.createSmartAccount(owner);
        assertTrue(account != address(0));

        // Verify native drip (0.01 ether)
        assertEq(account.balance, 0.01 ether);
        
        // Verify stablecoin drip (500 USDC)
        assertEq(usdc.balanceOf(account), 500 * 10**6);

        SmartWallet wallet = SmartWallet(payable(account));
        assertEq(wallet.sOwner(), owner);
        
        // Verify auto-registration with AuditRegistry
        assertEq(registry.companyMasters(account), owner);
    }

    function test_GetPredictedAddress() public {
        address owner = makeAddr("owner");
        address predicted = factory.getPredictedAddress(owner);
        address account = factory.createSmartAccount(owner);
        assertEq(predicted, account);
    }

    function test_GetUserClone() public {
        address owner = makeAddr("owner");
        address account = factory.createSmartAccount(owner);
        address retrievedAccount = factory.getUserClone(owner);
        assertEq(account, retrievedAccount);
    }

    function test_DeploymentWithNoFunds() public {
        address owner = makeAddr("owner-no-funds");
        vm.deal(address(factory), 0);
        
        // Temporarily unset stablecoin balance
        uint256 factoryUsdcBal = usdc.balanceOf(address(factory));
        vm.prank(address(factory));
        usdc.transfer(address(0xdead), factoryUsdcBal);

        address account = factory.createSmartAccount(owner);
        assertTrue(account != address(0));
        assertEq(account.balance, 0);
        assertEq(usdc.balanceOf(account), 0);
    }
}
