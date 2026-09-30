-- Aegis-Quant PostgreSQL / Supabase Schema Definition
-- Compliant with ANTIGRAVITY_INSTRUCTIONS.md Section 5

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Security Analyst', -- 'Admin', 'Security Analyst', 'Executive', 'Viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL, -- 'API', 'Database', 'Endpoint', 'Server', 'Cloud Storage', etc.
    description TEXT,
    criticality VARCHAR(50) NOT NULL DEFAULT 'High', -- 'Low', 'Medium', 'High', 'Critical'
    business_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    data_sensitivity NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- 0 to 100
    internet_exposed BOOLEAN NOT NULL DEFAULT FALSE,
    owner VARCHAR(255),
    environment VARCHAR(50) NOT NULL DEFAULT 'Production', -- 'Production', 'Staging', 'Development'
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vulnerabilities Table
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id VARCHAR(64) PRIMARY KEY,
    asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE CASCADE,
    cve_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cvss_score NUMERIC(4, 1) NOT NULL DEFAULT 5.0, -- 0.0 to 10.0
    exploitability_score NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- 0 to 100
    severity VARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    patch_available BOOLEAN NOT NULL DEFAULT FALSE,
    exploit_available BOOLEAN NOT NULL DEFAULT FALSE,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'Open', -- 'Open', 'In Progress', 'Mitigated', 'Resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Threats Table
CREATE TABLE IF NOT EXISTS threats (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    threat_type VARCHAR(100) NOT NULL, -- 'External Attacker', 'Ransomware', 'Credential Theft', 'Insider Threat', 'Supply Chain'
    activity_level NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- 0 to 100
    source VARCHAR(255),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Security Controls Table
CREATE TABLE IF NOT EXISTS controls (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    control_type VARCHAR(100) NOT NULL, -- 'WAF', 'EDR', 'MFA', 'Encryption', 'Network Segmentation', 'SIEM', 'Backup', 'IAM'
    description TEXT,
    effectiveness NUMERIC(5, 2) NOT NULL DEFAULT 70.00, -- 0 to 100
    coverage NUMERIC(5, 2) NOT NULL DEFAULT 80.00, -- 0 to 100
    status VARCHAR(50) NOT NULL DEFAULT 'Operational', -- 'Operational', 'Degraded', 'Planned', 'Disabled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Risks Table
CREATE TABLE IF NOT EXISTS risks (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability_id VARCHAR(64) REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    threat_id VARCHAR(64) REFERENCES threats(id) ON DELETE CASCADE,
    
    likelihood NUMERIC(6, 2) NOT NULL, -- 0 to 100
    impact NUMERIC(6, 2) NOT NULL,     -- 0 to 100
    inherent_risk NUMERIC(6, 2) NOT NULL, -- 0 to 100
    
    control_effectiveness NUMERIC(6, 2) NOT NULL DEFAULT 0.00, -- 0 to 100
    residual_risk NUMERIC(6, 2) NOT NULL, -- 0 to 100
    
    annual_frequency NUMERIC(8, 4) NOT NULL DEFAULT 0.10,
    loss_magnitude NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    eal NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Expected Annual Loss
    
    risk_level VARCHAR(50) NOT NULL, -- 'Low', 'Moderate', 'High', 'Very High', 'Critical'
    risk_status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Accepted', 'Remediated'
    
    calculation_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Investments Table
CREATE TABLE IF NOT EXISTS investments (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'Tooling', 'Infrastructure', 'Training', 'Remediation', 'Consulting'
    cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    implementation_time VARCHAR(50) NOT NULL DEFAULT '30 days',
    expected_likelihood_reduction NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    expected_impact_reduction NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    expected_risk_reduction NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    expected_eal_reduction NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    roi NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Proposed', -- 'Proposed', 'Approved', 'Implemented', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_vulns_asset ON vulnerabilities(asset_id);
CREATE INDEX IF NOT EXISTS idx_threats_org ON threats(organization_id);
CREATE INDEX IF NOT EXISTS idx_controls_org ON controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_risks_org ON risks(organization_id);
CREATE INDEX IF NOT EXISTS idx_risks_residual ON risks(residual_risk DESC);
CREATE INDEX IF NOT EXISTS idx_risks_eal ON risks(eal DESC);
CREATE INDEX IF NOT EXISTS idx_investments_org ON investments(organization_id);
