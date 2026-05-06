// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AuditRegistry.sol";
import "encrypted-types/EncryptedTypes.sol";

contract AuditRegistryTest is Test {
    AuditRegistry registry;

    address proxyAccount = makeAddr("proxyAccount");
    address master = makeAddr("master");
    address auditor = makeAddr("auditor");
    address other = makeAddr("other");

    function setUp() public {
        registry = new AuditRegistry();
        registry.registerAccount(proxyAccount, master);
    }

    function test_AddAuditorWithNoRecords() public {
        vm.prank(master);
        registry.addAuditor(proxyAccount, auditor);

        address[] memory auditors = registry.getAuditors(proxyAccount);
        assertEq(auditors.length, 1);
        assertEq(auditors[0], auditor);
        assertTrue(registry.isAuditorActive(proxyAccount, auditor));
        assertEq(uint8(registry.reviewerAccess(proxyAccount, auditor)), uint8(AuditRegistry.ReviewerAccess.Full));
    }

    function test_AddAuditorWithExplicitAccessLevel() public {
        vm.prank(master);
        registry.addAuditorWithAccess(proxyAccount, auditor, AuditRegistry.ReviewerAccess.Signal);

        assertTrue(registry.isAuditorActive(proxyAccount, auditor));
        assertEq(
            uint8(registry.reviewerAccess(proxyAccount, auditor)), uint8(AuditRegistry.ReviewerAccess.Signal)
        );
    }

    function test_CannotAddAuditorWithNoAccess() public {
        vm.prank(master);
        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidAccessLevel.selector);
        registry.addAuditorWithAccess(proxyAccount, auditor, AuditRegistry.ReviewerAccess.None);
    }

    function test_UpdateAuditorAccess() public {
        vm.prank(master);
        registry.addAuditorWithAccess(proxyAccount, auditor, AuditRegistry.ReviewerAccess.Signal);

        vm.prank(master);
        registry.updateAuditorAccess(proxyAccount, auditor, AuditRegistry.ReviewerAccess.Full);

        assertEq(uint8(registry.reviewerAccess(proxyAccount, auditor)), uint8(AuditRegistry.ReviewerAccess.Full));
    }

    function test_UpdateAuditorAccessRequiresActiveAuditor() public {
        vm.prank(master);
        vm.expectRevert(AuditRegistry.AuditRegistry__NotAuthorized.selector);
        registry.updateAuditorAccess(proxyAccount, auditor, AuditRegistry.ReviewerAccess.Signal);
    }

    function test_UpdateAuditorAccessCannotSetNone() public {
        vm.prank(master);
        registry.addAuditor(proxyAccount, auditor);

        vm.prank(master);
        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidAccessLevel.selector);
        registry.updateAuditorAccess(proxyAccount, auditor, AuditRegistry.ReviewerAccess.None);
    }

    function test_OnlyMasterCanAddAuditor() public {
        vm.prank(other);
        vm.expectRevert(AuditRegistry.AuditRegistry__NotAuthorized.selector);
        registry.addAuditor(proxyAccount, auditor);
    }

    function test_MaxFiveAuditors() public {
        for (uint160 i; i < registryMaxAuditors(); i++) {
            vm.prank(master);
            registry.addAuditor(proxyAccount, address(0x1000 + i));
        }

        vm.prank(master);
        vm.expectRevert(AuditRegistry.AuditRegistry__MaxAuditorsReached.selector);
        registry.addAuditor(proxyAccount, address(0x9999));
    }

    function test_RemoveAuditorMarksInactive() public {
        vm.prank(master);
        registry.addAuditor(proxyAccount, auditor);

        vm.prank(master);
        registry.removeAuditor(proxyAccount, auditor);

        assertFalse(registry.isAuditorActive(proxyAccount, auditor));
        assertEq(uint8(registry.reviewerAccess(proxyAccount, auditor)), uint8(AuditRegistry.ReviewerAccess.None));
        assertEq(registry.getAuditors(proxyAccount).length, 0);
    }

    function test_UnauthorizedReviewTestCreationRevertsBeforeFheValidation() public {
        externalEuint128 thresholdHandle;

        vm.prank(other);
        vm.expectRevert(AuditRegistry.AuditRegistry__NotAuthorized.selector);
        registry.createLargePaymentReviewTest(proxyAccount, thresholdHandle, "");
    }

    function test_InvalidCategoryAndJurisdictionReviewScopesRevertBeforeFheValidation() public {
        externalEuint128 thresholdHandle;

        vm.prank(master);
        registry.addAuditorWithAccess(proxyAccount, auditor, AuditRegistry.ReviewerAccess.Signal);

        vm.prank(auditor);
        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidScope.selector);
        registry.createCategoryExposureReviewTest(proxyAccount, 0, thresholdHandle, "");

        vm.prank(auditor);
        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidScope.selector);
        registry.createCategoryExposureReviewTest(proxyAccount, 11, thresholdHandle, "");

        vm.prank(auditor);
        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidScope.selector);
        registry.createJurisdictionExposureReviewTest(proxyAccount, 0, thresholdHandle, "");

        vm.prank(auditor);
        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidScope.selector);
        registry.createJurisdictionExposureReviewTest(proxyAccount, 14, thresholdHandle, "");
    }

    function test_PrivateReviewReadsRequireAuditorCaller() public {
        vm.prank(other);
        vm.expectRevert(AuditRegistry.AuditRegistry__NotAuthorized.selector);
        registry.getAuditorReviewTestIds(auditor);

        vm.prank(other);
        vm.expectRevert(AuditRegistry.AuditRegistry__NotAuthorized.selector);
        registry.getReviewResultCount(auditor);
    }

    function test_InvalidRollupScopeReverts() public {
        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidScope.selector);
        registry.getEncryptedCategoryTotal(proxyAccount, 11);

        vm.expectRevert(AuditRegistry.AuditRegistry__InvalidScope.selector);
        registry.getEncryptedJurisdictionTotal(proxyAccount, 14);
    }

    function registryMaxAuditors() internal pure returns (uint160) {
        return 5;
    }
}
