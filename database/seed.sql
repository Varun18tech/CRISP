-- Aegis-Quant Synthetic Demo Data
-- Compliant with ANTIGRAVITY_INSTRUCTIONS.md Section 10

-- 1. Default Organization
INSERT INTO organizations (id, name, industry, currency, created_at, updated_at)
VALUES ('org_default', 'CyberAegis Financial Global', 'Financial Services & Banking', 'INR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Default User Profiles
INSERT INTO user_profiles (id, organization_id, full_name, role, created_at, updated_at)
VALUES 
    ('user_admin', 'org_default', 'Alex Mercer', 'Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('user_analyst', 'org_default', 'Priya Sharma', 'Security Analyst', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('user_exec', 'org_default', 'David Vance', 'Executive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 3. Assets
INSERT INTO assets (id, organization_id, name, asset_type, description, criticality, business_value, data_sensitivity, internet_exposed, owner, environment, status)
VALUES 
    ('ast_payment_api', 'org_default', 'Payment Processing Gateway API', 'API', 'Core payment gateway processing customer credit card transactions and settlements', 'Critical', 50000000.00, 95.00, TRUE, 'Payments Engineering Team', 'Production', 'Active'),
    ('ast_cust_db', 'org_default', 'Primary Customer Core Database', 'Database', 'PostgreSQL cluster housing PII, KYC records, and encrypted auth credentials', 'Critical', 85000000.00, 98.00, FALSE, 'Data Platform Team', 'Production', 'Active'),
    ('ast_admin_portal', 'org_default', 'Global Operations Admin Portal', 'Portal', 'Internal operational portal for customer support and authorization overrides', 'High', 15000000.00, 75.00, TRUE, 'DevOps & IT Ops', 'Production', 'Active'),
    ('ast_cloud_storage', 'org_default', 'Customer Documents S3/GCS Bucket', 'Cloud Storage', 'Object storage containing encrypted KYC docs and monthly billing statements', 'High', 20000000.00, 85.00, FALSE, 'Cloud Infrastructure Team', 'Production', 'Active'),
    ('ast_employee_ep', 'org_default', 'Staff Enterprise Laptops Fleet', 'Endpoint', 'Corporate fleet of 250+ macOS & Windows employee laptops', 'Medium', 8000000.00, 60.00, TRUE, 'IT Support Team', 'Production', 'Active'),
    ('ast_prod_web', 'org_default', 'Public Marketing & Customer Web App', 'Server', 'Frontend customer-facing web presence and public documentation site', 'Medium', 5000000.00, 40.00, TRUE, 'Growth Engineering Team', 'Production', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 4. Vulnerabilities
INSERT INTO vulnerabilities (id, asset_id, cve_id, name, description, cvss_score, exploitability_score, severity, patch_available, exploit_available, status)
VALUES 
    ('vuln_rce', 'ast_payment_api', 'CVE-2024-21413', 'Remote Code Execution in Parsing Library', 'Unauthenticated RCE vulnerability via deserialization flaws in processing payload', 9.8, 90.00, 'Critical', TRUE, TRUE, 'Open'),
    ('vuln_sqli', 'ast_admin_portal', 'CVE-2024-3094', 'SQL Injection in Filtering Parameter', 'Blind SQL injection in operational search filter allows exfiltration of session data', 8.6, 80.00, 'High', TRUE, FALSE, 'In Progress'),
    ('vuln_auth_bypass', 'ast_payment_api', 'CVE-2023-44487', 'Authentication Bypass & Rapid Reset', 'HTTP/2 rapid reset leading to state corruption and authentication bypass under load', 8.2, 75.00, 'High', TRUE, TRUE, 'Open'),
    ('vuln_cloud_leak', 'ast_cloud_storage', 'CVE-2024-21626', 'Misconfigured Object ACL Permissions', 'Storage bucket policy allows anonymous read access to specific document subdirectories', 7.5, 70.00, 'High', TRUE, FALSE, 'Open'),
    ('vuln_endpoint_malware', 'ast_employee_ep', 'CVE-2024-1086', 'Privilege Escalation via Kernel Flaw', 'Local privilege escalation vulnerability on endpoint kernels allowing payload staging', 7.8, 65.00, 'High', FALSE, TRUE, 'Open')
ON CONFLICT (id) DO NOTHING;

-- 5. Threats
INSERT INTO threats (id, organization_id, name, description, threat_type, activity_level, source)
VALUES 
    ('tht_ext_apt', 'org_default', 'Advanced Nation-State Financial Threat Actor', 'Targeted cyber-espionage and financial extortion actor actively weaponizing zero-day exploits', 'External Attacker', 85.00, 'Dark Web & CTI Feeds'),
    ('tht_ransomware', 'org_default', 'LockBit Ransomware Syndicate', 'Automated double-extortion ransomware campaigns targeting cloud and on-prem enterprise systems', 'Ransomware', 90.00, 'US-CERT & Industry Alerts'),
    ('tht_cred_theft', 'org_default', 'Mass Credential Stuffing & Session Hijacking', 'Distributed credential stuffing and infostealer malware stealing session tokens', 'Credential Theft', 80.00, 'Identity Intelligence'),
    ('tht_insider', 'org_default', 'Privileged Account Abuse & Misuse', 'Unauthorized access or exfiltration by disgruntled or compromised staff members', 'Insider Threat', 45.00, 'Internal Audit'),
    ('tht_supply_chain', 'org_default', 'Upstream NPM/PyPI Package Poisoning', 'Backdoor injection in open-source dependencies deployed in build pipeline', 'Supply Chain Attack', 60.00, 'Vulnerability Feeds')
ON CONFLICT (id) DO NOTHING;

-- 6. Security Controls
INSERT INTO controls (id, organization_id, name, control_type, description, effectiveness, coverage, status)
VALUES 
    ('ctl_waf', 'org_default', 'Cloudflare Enterprise Web Application Firewall', 'WAF', 'Cloud-edge inspection with managed OWASP rules and rate limiting', 78.00, 85.00, 'Operational'),
    ('ctl_edr', 'org_default', 'CrowdStrike Falcon Enterprise EDR', 'EDR', 'Kernel-level telemetry, automated threat containment, and behavioral behavioral blocking', 85.00, 92.00, 'Operational'),
    ('ctl_mfa', 'org_default', 'FIDO2 Hardware-backed Multi-Factor Authentication', 'MFA', 'Mandatory WebAuthn hardware keys required for all administrative access', 92.00, 95.00, 'Operational'),
    ('ctl_encrypt', 'org_default', 'Envelope Encryption with AWS/GCP KMS', 'Encryption', 'AES-256 field-level encryption for cardholder data and database at-rest storage', 95.00, 98.00, 'Operational'),
    ('ctl_siem', 'org_default', 'Datadog Cloud SIEM & Real-time Threat Detection', 'SIEM', 'Centralized ingestion of VPC, audit, and container logs with 24/7 alert paging', 75.00, 88.00, 'Operational'),
    ('ctl_backup', 'org_default', 'Immutable Off-site Air-gapped Backups', 'Backup', 'Write-once-read-many (WORM) daily snapshots with 1-hour RPO guarantee', 90.00, 90.00, 'Operational')
ON CONFLICT (id) DO NOTHING;

-- 7. Risks (Calculated deterministically using Risk Engine v1 formulas)
-- E.g. Payment API RCE: Likelihood = 89.70, Impact = 89.25, Inherent Risk = 80.05, Control Adjustment = 65% effective, Residual Risk = 52.03, EAL = 0.35 * 40000000 = 14,000,000 INR
INSERT INTO risks (id, organization_id, asset_id, vulnerability_id, threat_id, likelihood, impact, inherent_risk, control_effectiveness, residual_risk, annual_frequency, loss_magnitude, eal, risk_level, risk_status, calculation_version)
VALUES 
    ('rsk_payment_rce', 'org_default', 'ast_payment_api', 'vuln_rce', 'tht_ext_apt', 89.70, 89.25, 80.05, 35.00, 52.03, 0.3500, 40000000.00, 14000000.00, 'Very High', 'Active', 'v1'),
    ('rsk_db_ransomware', 'org_default', 'ast_cust_db', 'vuln_auth_bypass', 'tht_ransomware', 82.50, 94.00, 77.55, 45.00, 42.65, 0.2000, 65000000.00, 13000000.00, 'Very High', 'Active', 'v1'),
    ('rsk_admin_sqli', 'org_default', 'ast_admin_portal', 'vuln_sqli', 'tht_cred_theft', 74.00, 72.50, 53.65, 50.00, 26.83, 0.2500, 15000000.00, 3750000.00, 'Moderate', 'Active', 'v1'),
    ('rsk_cloud_leak', 'org_default', 'ast_cloud_storage', 'vuln_cloud_leak', 'tht_ext_apt', 68.00, 81.00, 55.08, 40.00, 33.05, 0.1500, 20000000.00, 3000000.00, 'Moderate', 'Active', 'v1'),
    ('rsk_endpoint_malware', 'org_default', 'ast_employee_ep', 'vuln_endpoint_malware', 'tht_ransomware', 62.00, 58.00, 35.96, 55.00, 16.18, 0.4000, 8000000.00, 3200000.00, 'Low', 'Active', 'v1')
ON CONFLICT (id) DO NOTHING;

-- 8. Security Investments (Scenarios)
INSERT INTO investments (id, organization_id, name, description, category, cost, implementation_time, expected_likelihood_reduction, expected_impact_reduction, expected_risk_reduction, expected_eal_reduction, roi, status)
VALUES 
    ('inv_patch_rce', 'org_default', 'Payment Gateway Emergency Patch & Zero-Trust Verification', 'Immediate patching of CVE-2024-21413 with canary rollout and mutual TLS service mesh', 'Remediation', 500000.00, '7 days', 35.00, 10.00, 28.50, 8500000.00, 1600.00, 'Proposed'),
    ('inv_deploy_waf_rules', 'org_default', 'Next-Gen API Shield & Managed Behavioral WAF', 'Deploy advanced API behavioral anomaly detection on all internet-facing endpoints', 'Tooling', 1200000.00, '14 days', 25.00, 20.00, 24.00, 7200000.00, 500.00, 'Proposed'),
    ('inv_db_encryption', 'org_default', 'Database Confidential Computing & Tokenization', 'Hardware-enforced confidential computing enclave and customer PII tokenization engine', 'Infrastructure', 2500000.00, '45 days', 10.00, 45.00, 32.00, 9500000.00, 280.00, 'Proposed'),
    ('inv_staff_training', 'org_default', 'Enterprise Spear-Phishing & Social Engineering Drills', 'Quarterly simulated adversarial campaigns and security champions program', 'Training', 400000.00, '30 days', 18.00, 5.00, 11.50, 1800000.00, 350.00, 'Approved')
ON CONFLICT (id) DO NOTHING;
