import os
import glob

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Specific replacements
    content = content.replace('ComplianceRegistry', 'AuditRegistry')
    content = content.replace('IComplianceRegistry', 'IAuditRegistry')
    content = content.replace('ComplianceRegistryABI', 'AuditRegistryABI')
    
    # Components / Files
    content = content.replace('ComplianceSummary', 'AuditSummary')
    content = content.replace('ComplianceDashboard', 'AuditDashboard')
    content = content.replace('ComplianceOverview', 'AuditOverview')
    content = content.replace('useComplianceData', 'useAuditData')
    content = content.replace('compliance-enums', 'audit-enums')
    content = content.replace('fhe-compliance', 'fhe-audit')
    
    # Paths / URLs
    content = content.replace('/compliance', '/records')
    content = content.replace('compliance/page.tsx', 'records/page.tsx')
    
    # Words
    content = content.replace('Compliance', 'Audit')
    content = content.replace('compliance', 'audit')
    content = content.replace('COMPLIANCE', 'AUDIT')
    
    # Revert `/records` if it got turned into `/audit` ? Wait. If I do replace '/compliance' to '/records' before 'compliance' -> 'audit', '/compliance' becomes '/records'. That is correct.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

extensions = ['.ts', '.tsx', '.sol', '.md', '.mdx']
for root, dirs, files in os.walk('/home/dev/complyr'):
    if 'node_modules' in root or '.git' in root or '.next' in root or 'out' in root or 'dist' in root:
        continue
    for file in files:
        if any(file.endswith(ext) for ext in extensions):
            filepath = os.path.join(root, file)
            replace_in_file(filepath)

# Now rename files and directories
import shutil

renames = [
    ('/home/dev/complyr/packages/contracts/src/ComplianceRegistry.sol', '/home/dev/complyr/packages/contracts/src/AuditRegistry.sol'),
    ('/home/dev/complyr/packages/contracts/src/IComplianceRegistry.sol', '/home/dev/complyr/packages/contracts/src/IAuditRegistry.sol'),
    ('/home/dev/complyr/packages/contracts/test/ComplianceRegistry.t.sol', '/home/dev/complyr/packages/contracts/test/AuditRegistry.t.sol'),
    ('/home/dev/complyr/apps/web/src/app/(protected)/compliance', '/home/dev/complyr/apps/web/src/app/(protected)/records'),
    ('/home/dev/complyr/apps/web/src/components/compliance', '/home/dev/complyr/apps/web/src/components/audit'),
    ('/home/dev/complyr/apps/web/src/hooks/useComplianceData.ts', '/home/dev/complyr/apps/web/src/hooks/useAuditData.ts'),
    ('/home/dev/complyr/apps/web/src/lib/fhe-compliance.ts', '/home/dev/complyr/apps/web/src/lib/fhe-audit.ts'),
    ('/home/dev/complyr/apps/web/src/lib/compliance-enums.ts', '/home/dev/complyr/apps/web/src/lib/audit-enums.ts'),
    ('/home/dev/complyr/apps/web/src/lib/abi/ComplianceRegistryABI.ts', '/home/dev/complyr/apps/web/src/lib/abi/AuditRegistryABI.ts'),
    ('/home/dev/complyr/apps/web/src/components/audit/ComplianceDashboard.tsx', '/home/dev/complyr/apps/web/src/components/audit/AuditDashboard.tsx'),
    ('/home/dev/complyr/apps/web/src/components/audit/ComplianceOverview.tsx', '/home/dev/complyr/apps/web/src/components/audit/AuditOverview.tsx'),
    ('/home/dev/complyr/apps/web/src/components/dashboard/ComplianceSummary.tsx', '/home/dev/complyr/apps/web/src/components/dashboard/AuditSummary.tsx'),
    ('/home/dev/complyr/apps/web/content/docs/compliance-model.mdx', '/home/dev/complyr/apps/web/content/docs/audit-model.mdx')
]

for src, dst in renames:
    if os.path.exists(src):
        os.rename(src, dst)
        print(f'Renamed {src} to {dst}')

