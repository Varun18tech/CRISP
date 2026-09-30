from sqlalchemy.orm import Session
from backend.app.models.organization import Organization, UserProfile
from backend.app.models.asset import Asset
from backend.app.models.vulnerability import Vulnerability
from backend.app.models.threat import Threat
from backend.app.models.control import Control
from backend.app.models.risk import Risk
from backend.app.models.investment import Investment
from backend.app.core.logging import logger

def seed_database_if_empty(db: Session):
    try:
        org = db.query(Organization).first()
        if org:
            return  # Already seeded

        logger.info("Database is empty. Seeding initial synthetic enterprise demo data...")

        # 1. Organization
        org = Organization(
            id="org_default",
            name="CyberAegis Financial Global",
            industry="Financial Services & Banking",
            currency="INR"
        )
        db.add(org)

        # 2. User Profile
        user = UserProfile(
            id="user_analyst",
            organization_id="org_default",
            full_name="Priya Sharma",
            role="Security Analyst"
        )
        db.add(user)

        # 3. Assets
        assets = [
            Asset(
                id="ast_payment_api",
                organization_id="org_default",
                name="Payment Processing Gateway API",
                asset_type="API",
                description="Core payment gateway processing customer credit card transactions and settlements",
                criticality="Critical",
                business_value=50000000.00,
                data_sensitivity=95.00,
                internet_exposed=True,
                owner="Payments Engineering Team",
                environment="Production",
                status="Active"
            ),
            Asset(
                id="ast_cust_db",
                organization_id="org_default",
                name="Primary Customer Core Database",
                asset_type="Database",
                description="PostgreSQL cluster housing PII, KYC records, and encrypted auth credentials",
                criticality="Critical",
                business_value=85000000.00,
                data_sensitivity=98.00,
                internet_exposed=False,
                owner="Data Platform Team",
                environment="Production",
                status="Active"
            ),
            Asset(
                id="ast_admin_portal",
                organization_id="org_default",
                name="Global Operations Admin Portal",
                asset_type="Portal",
                description="Internal operational portal for customer support and authorization overrides",
                criticality="High",
                business_value=15000000.00,
                data_sensitivity=75.00,
                internet_exposed=True,
                owner="DevOps & IT Ops",
                environment="Production",
                status="Active"
            ),
            Asset(
                id="ast_cloud_storage",
                organization_id="org_default",
                name="Customer Documents S3/GCS Bucket",
                asset_type="Cloud Storage",
                description="Object storage containing encrypted KYC docs and monthly billing statements",
                criticality="High",
                business_value=20000000.00,
                data_sensitivity=85.00,
                internet_exposed=False,
                owner="Cloud Infrastructure Team",
                environment="Production",
                status="Active"
            ),
            Asset(
                id="ast_employee_ep",
                organization_id="org_default",
                name="Staff Enterprise Laptops Fleet",
                asset_type="Endpoint",
                description="Corporate fleet of 250+ macOS & Windows employee laptops",
                criticality="Medium",
                business_value=8000000.00,
                data_sensitivity=60.00,
                internet_exposed=True,
                owner="IT Support Team",
                environment="Production",
                status="Active"
            ),
        ]
        db.add_all(assets)

        # 4. Vulnerabilities
        vulns = [
            Vulnerability(
                id="vuln_rce",
                asset_id="ast_payment_api",
                cve_id="CVE-2024-21413",
                name="Remote Code Execution in Parsing Library",
                description="Unauthenticated RCE vulnerability via deserialization flaws in processing payload",
                cvss_score=9.8,
                exploitability_score=90.00,
                severity="Critical",
                patch_available=True,
                exploit_available=True,
                status="Open"
            ),
            Vulnerability(
                id="vuln_sqli",
                asset_id="ast_admin_portal",
                cve_id="CVE-2024-3094",
                name="SQL Injection in Filtering Parameter",
                description="Blind SQL injection in operational search filter allows exfiltration of session data",
                cvss_score=8.6,
                exploitability_score=80.00,
                severity="High",
                patch_available=True,
                exploit_available=False,
                status="In Progress"
            ),
            Vulnerability(
                id="vuln_auth_bypass",
                asset_id="ast_cust_db",
                cve_id="CVE-2023-44487",
                name="Authentication Bypass & Rapid Reset",
                description="HTTP/2 rapid reset leading to state corruption and authentication bypass under load",
                cvss_score=8.2,
                exploitability_score=75.00,
                severity="High",
                patch_available=True,
                exploit_available=True,
                status="Open"
            ),
            Vulnerability(
                id="vuln_cloud_leak",
                asset_id="ast_cloud_storage",
                cve_id="CVE-2024-21626",
                name="Misconfigured Object ACL Permissions",
                description="Storage bucket policy allows anonymous read access to specific document subdirectories",
                cvss_score=7.5,
                exploitability_score=70.00,
                severity="High",
                patch_available=True,
                exploit_available=False,
                status="Open"
            ),
            Vulnerability(
                id="vuln_endpoint_malware",
                asset_id="ast_employee_ep",
                cve_id="CVE-2024-1086",
                name="Privilege Escalation via Kernel Flaw",
                description="Local privilege escalation vulnerability on endpoint kernels allowing payload staging",
                cvss_score=7.8,
                exploitability_score=65.00,
                severity="High",
                patch_available=False,
                exploit_available=True,
                status="Open"
            ),
        ]
        db.add_all(vulns)

        # 5. Threats
        threats = [
            Threat(
                id="tht_ext_apt",
                organization_id="org_default",
                name="Advanced Nation-State Financial Threat Actor",
                description="Targeted cyber-espionage and financial extortion actor actively weaponizing zero-day exploits",
                threat_type="External Attacker",
                activity_level=85.00,
                source="Dark Web & CTI Feeds"
            ),
            Threat(
                id="tht_ransomware",
                organization_id="org_default",
                name="LockBit Ransomware Syndicate",
                description="Automated double-extortion ransomware campaigns targeting cloud and on-prem enterprise systems",
                threat_type="Ransomware",
                activity_level=90.00,
                source="US-CERT & Industry Alerts"
            ),
            Threat(
                id="tht_cred_theft",
                organization_id="org_default",
                name="Mass Credential Stuffing & Session Hijacking",
                description="Distributed credential stuffing and infostealer malware stealing session tokens",
                threat_type="Credential Theft",
                activity_level=80.00,
                source="Identity Intelligence"
            ),
        ]
        db.add_all(threats)

        # 6. Controls
        controls = [
            Control(
                id="ctl_waf",
                organization_id="org_default",
                name="Cloudflare Enterprise Web Application Firewall",
                control_type="WAF",
                description="Cloud-edge inspection with managed OWASP rules and rate limiting",
                effectiveness=78.00,
                coverage=85.00,
                status="Operational"
            ),
            Control(
                id="ctl_edr",
                organization_id="org_default",
                name="CrowdStrike Falcon Enterprise EDR",
                control_type="EDR",
                description="Kernel-level telemetry, automated threat containment, and behavioral blocking",
                effectiveness=85.00,
                coverage=92.00,
                status="Operational"
            ),
            Control(
                id="ctl_mfa",
                organization_id="org_default",
                name="FIDO2 Hardware-backed Multi-Factor Authentication",
                control_type="MFA",
                description="Mandatory WebAuthn hardware keys required for all administrative access",
                effectiveness=92.00,
                coverage=95.00,
                status="Operational"
            ),
            Control(
                id="ctl_encrypt",
                organization_id="org_default",
                name="Envelope Encryption with AWS/GCP KMS",
                control_type="Encryption",
                description="AES-256 field-level encryption for cardholder data and database at-rest storage",
                effectiveness=95.00,
                coverage=98.00,
                status="Operational"
            ),
        ]
        db.add_all(controls)

        # 7. Risks
        risks = [
            Risk(
                id="rsk_payment_rce",
                organization_id="org_default",
                asset_id="ast_payment_api",
                vulnerability_id="vuln_rce",
                threat_id="tht_ext_apt",
                likelihood=89.70,
                impact=89.25,
                inherent_risk=80.05,
                control_effectiveness=35.00,
                residual_risk=52.03,
                annual_frequency=0.3500,
                loss_magnitude=40000000.00,
                eal=14000000.00,
                risk_level="Very High",
                risk_status="Active",
                calculation_version="v1"
            ),
            Risk(
                id="rsk_db_ransomware",
                organization_id="org_default",
                asset_id="ast_cust_db",
                vulnerability_id="vuln_auth_bypass",
                threat_id="tht_ransomware",
                likelihood=82.50,
                impact=94.00,
                inherent_risk=77.55,
                control_effectiveness=45.00,
                residual_risk=42.65,
                annual_frequency=0.2000,
                loss_magnitude=65000000.00,
                eal=13000000.00,
                risk_level="Very High",
                risk_status="Active",
                calculation_version="v1"
            ),
            Risk(
                id="rsk_admin_sqli",
                organization_id="org_default",
                asset_id="ast_admin_portal",
                vulnerability_id="vuln_sqli",
                threat_id="tht_cred_theft",
                likelihood=74.00,
                impact=72.50,
                inherent_risk=53.65,
                control_effectiveness=50.00,
                residual_risk=26.83,
                annual_frequency=0.2500,
                loss_magnitude=15000000.00,
                eal=3750000.00,
                risk_level="Moderate",
                risk_status="Active",
                calculation_version="v1"
            ),
            Risk(
                id="rsk_cloud_leak",
                organization_id="org_default",
                asset_id="ast_cloud_storage",
                vulnerability_id="vuln_cloud_leak",
                threat_id="tht_ext_apt",
                likelihood=68.00,
                impact=81.00,
                inherent_risk=55.08,
                control_effectiveness=40.00,
                residual_risk=33.05,
                annual_frequency=0.1500,
                loss_magnitude=20000000.00,
                eal=3000000.00,
                risk_level="Moderate",
                risk_status="Active",
                calculation_version="v1"
            ),
            Risk(
                id="rsk_endpoint_malware",
                organization_id="org_default",
                asset_id="ast_employee_ep",
                vulnerability_id="vuln_endpoint_malware",
                threat_id="tht_ransomware",
                likelihood=62.00,
                impact=58.00,
                inherent_risk=35.96,
                control_effectiveness=55.00,
                residual_risk=16.18,
                annual_frequency=0.4000,
                loss_magnitude=8000000.00,
                eal=3200000.00,
                risk_level="Low",
                risk_status="Active",
                calculation_version="v1"
            ),
        ]
        db.add_all(risks)

        # 8. Investments
        investments = [
            Investment(
                id="inv_patch_rce",
                organization_id="org_default",
                name="Payment Gateway Emergency Patch & Zero-Trust Verification",
                description="Immediate patching of CVE-2024-21413 with canary rollout and mutual TLS service mesh",
                category="Remediation",
                cost=500000.00,
                implementation_time="7 days",
                expected_likelihood_reduction=35.00,
                expected_impact_reduction=10.00,
                expected_risk_reduction=28.50,
                expected_eal_reduction=8500000.00,
                roi=1600.00,
                status="Proposed"
            ),
            Investment(
                id="inv_deploy_waf_rules",
                organization_id="org_default",
                name="Next-Gen API Shield & Managed Behavioral WAF",
                description="Deploy advanced API behavioral anomaly detection on all internet-facing endpoints",
                category="Tooling",
                cost=1200000.00,
                implementation_time="14 days",
                expected_likelihood_reduction=25.00,
                expected_impact_reduction=20.00,
                expected_risk_reduction=24.00,
                expected_eal_reduction=7200000.00,
                roi=500.00,
                status="Proposed"
            ),
            Investment(
                id="inv_db_encryption",
                organization_id="org_default",
                name="Database Confidential Computing & Tokenization",
                description="Hardware-enforced confidential computing enclave and customer PII tokenization engine",
                category="Infrastructure",
                cost=2500000.00,
                implementation_time="45 days",
                expected_likelihood_reduction=10.00,
                expected_impact_reduction=45.00,
                expected_risk_reduction=32.00,
                expected_eal_reduction=9500000.00,
                roi=280.00,
                status="Proposed"
            ),
            Investment(
                id="inv_staff_training",
                organization_id="org_default",
                name="Enterprise Spear-Phishing & Social Engineering Drills",
                description="Quarterly simulated adversarial campaigns and security champions program",
                category="Training",
                cost=400000.00,
                implementation_time="30 days",
                expected_likelihood_reduction=18.00,
                expected_impact_reduction=5.00,
                expected_risk_reduction=11.50,
                expected_eal_reduction=1800000.00,
                roi=350.00,
                status="Approved"
            ),
        ]
        db.add_all(investments)

        db.commit()
        logger.info("Demo data successfully seeded into database.")
    except Exception as exc:
        db.rollback()
        logger.error(f"Error seeding database: {exc}", exc_info=True)
