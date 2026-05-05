// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ComplianceRegistry.sol";
import "encrypted-types/EncryptedTypes.sol";

contract ComplianceRegistryTest is Test {
    ComplianceRegistry registry;

    address proxyAccount = makeAddr("proxyAccount");
    address master = makeAddr("master");
    address auditor = makeAddr("auditor");
    address other = makeAddr("other");

    function setUp() public {
        registry = new ComplianceRegistry();
        registry.registerAccount(proxyAccount, master);
    }

    function test_AddAuditorWithNoRecords() public {
        vm.prank(master);
        registry.addAuditor(proxyAccount, auditor);

        address[] memory auditors = registry.getAuditors(proxyAccount);
        assertEq(auditors.length, 1);
        assertEq(auditors[0], auditor);
        assertTrue(registry.isAuditorActive(proxyAccount, auditor));
    }

    function test_OnlyMasterCanAddAuditor() public {
        vm.prank(other);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__NotAuthorized.selector);
        registry.addAuditor(proxyAccount, auditor);
    }

    function test_MaxFiveAuditors() public {
        for (uint160 i; i < registryMaxAuditors(); i++) {
            vm.prank(master);
            registry.addAuditor(proxyAccount, address(0x1000 + i));
        }

        vm.prank(master);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__MaxAuditorsReached.selector);
        registry.addAuditor(proxyAccount, address(0x9999));
    }

    function test_RemoveAuditorMarksInactive() public {
        vm.prank(master);
        registry.addAuditor(proxyAccount, auditor);

        vm.prank(master);
        registry.removeAuditor(proxyAccount, auditor);

        assertFalse(registry.isAuditorActive(proxyAccount, auditor));
        assertEq(registry.getAuditors(proxyAccount).length, 0);
    }

    function test_UnauthorizedReviewTestCreationRevertsBeforeFheValidation() public {
        externalEuint128 thresholdHandle;

        vm.prank(other);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__NotAuthorized.selector);
        registry.createLargePaymentReviewTest(proxyAccount, thresholdHandle, "");
    }

    function test_InvalidCategoryAndJurisdictionReviewScopesRevertBeforeFheValidation() public {
        externalEuint128 thresholdHandle;

        vm.prank(master);
        registry.addAuditor(proxyAccount, auditor);

        vm.prank(auditor);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__InvalidScope.selector);
        registry.createCategoryExposureReviewTest(proxyAccount, 0, thresholdHandle, "");

        vm.prank(auditor);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__InvalidScope.selector);
        registry.createCategoryExposureReviewTest(proxyAccount, 11, thresholdHandle, "");

        vm.prank(auditor);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__InvalidScope.selector);
        registry.createJurisdictionExposureReviewTest(proxyAccount, 0, thresholdHandle, "");

        vm.prank(auditor);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__InvalidScope.selector);
        registry.createJurisdictionExposureReviewTest(proxyAccount, 14, thresholdHandle, "");
    }

    function test_PrivateReviewReadsRequireAuditorCaller() public {
        vm.prank(other);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__NotAuthorized.selector);
        registry.getAuditorReviewTestIds(auditor);

        vm.prank(other);
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__NotAuthorized.selector);
        registry.getReviewResultCount(auditor);
    }

    function test_InvalidRollupScopeReverts() public {
        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__InvalidScope.selector);
        registry.getEncryptedCategoryTotal(proxyAccount, 11);

        vm.expectRevert(ComplianceRegistry.ComplianceRegistry__InvalidScope.selector);
        registry.getEncryptedJurisdictionTotal(proxyAccount, 14);
    }

    function registryMaxAuditors() internal pure returns (uint160) {
        return 5;
    }
}
