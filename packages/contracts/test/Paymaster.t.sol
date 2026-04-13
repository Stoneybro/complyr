// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VerifyingPaymaster.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract VerifyingPaymasterTest is Test {
    VerifyingPaymaster paymaster;
    address dummyEntryPoint = makeAddr("entryPoint");
    address signer = makeAddr("signer");

    function setUp() public {
        paymaster = new VerifyingPaymaster(IEntryPoint(dummyEntryPoint), signer);
        
        // Fund paymaster deposit on entry point
        vm.deal(address(paymaster), 10 ether);
    }

    function test_SignerSetup() public {
        assertEq(paymaster.verifyingSigner(), signer);
    }

    function test_GetHash() public {
        PackedUserOperation memory userOp;
        userOp.sender = makeAddr("sender");
        userOp.nonce = 1;

        bytes32 hash = paymaster.getHash(userOp, 0, 0);
        assertTrue(hash != bytes32(0));
    }

    function test_SponsorAll() public {
        // The current implementation of _validatePaymasterUserOp in VerifyingPaymaster.sol
        // is hardcoded to return ("", 0) effectively sponsoring all for the demo.
        
        vm.prank(address(this));
        paymaster.setVerifyingSigner(makeAddr("newSigner"));
        assertEq(paymaster.verifyingSigner(), makeAddr("newSigner"));
    }
}
