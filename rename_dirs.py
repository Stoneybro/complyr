import os

renames = [
    ('/home/dev/complyr/apps/web/src/components/compliance', '/home/dev/complyr/apps/web/src/components/records'),
    ('/home/dev/complyr/apps/web/src/hooks/useComplianceData.ts', '/home/dev/complyr/apps/web/src/hooks/useAuditData.ts'),
    ('/home/dev/complyr/apps/web/src/lib/fhe-compliance.ts', '/home/dev/complyr/apps/web/src/lib/fhe-audit.ts'),
    ('/home/dev/complyr/apps/web/src/lib/compliance-enums.ts', '/home/dev/complyr/apps/web/src/lib/audit-enums.ts'),
    ('/home/dev/complyr/apps/web/src/lib/abi/ComplianceRegistryABI.ts', '/home/dev/complyr/apps/web/src/lib/abi/AuditRegistryABI.ts'),
    ('/home/dev/complyr/apps/web/src/components/records/ComplianceDashboard.tsx', '/home/dev/complyr/apps/web/src/components/records/AuditDashboard.tsx'),
    ('/home/dev/complyr/apps/web/src/components/records/ComplianceOverview.tsx', '/home/dev/complyr/apps/web/src/components/records/AuditOverview.tsx'),
    ('/home/dev/complyr/apps/web/src/components/dashboard/ComplianceSummary.tsx', '/home/dev/complyr/apps/web/src/components/dashboard/AuditSummary.tsx'),
    ('/home/dev/complyr/apps/web/content/docs/compliance-model.mdx', '/home/dev/complyr/apps/web/content/docs/audit-model.mdx')
]

for src, dst in renames:
    if os.path.exists(src):
        os.rename(src, dst)
        print(f"Renamed {src} to {dst}")
    else:
        print(f"Not found: {src}")
