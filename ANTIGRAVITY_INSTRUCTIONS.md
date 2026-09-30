# AEGIS-QUANT — ANTIGRAVITY MASTER INSTRUCTIONS

> **Document Type:** Master AI Development Specification  
> **Project:** Aegis-Quant  
> **Purpose:** Authoritative instructions for Antigravity IDE / AI coding agents  
> **Status:** Initial implementation specification  
> **Rule:** This document is the source of truth for architecture, implementation order, naming, technology choices, and project behavior.

---

# 1. PROJECT OVERVIEW

## 1.1 Project Name

**Aegis-Quant**

## 1.2 Project Definition

Aegis-Quant is an **AI-powered Continuous Cyber Risk Quantification and Investment Optimization Platform**.

The platform converts raw cybersecurity information into understandable, business-oriented risk measurements.

Traditional cybersecurity tools primarily communicate using:

- CVSS scores
- Vulnerability counts
- Open ports
- Security alerts
- Malware detections
- Compliance findings
- Asset inventories

Aegis-Quant must transform these technical signals into:

- Likelihood of successful exploitation
- Business impact
- Inherent risk
- Residual risk
- Risk exposure
- Expected Annual Loss (EAL)
- Risk reduction from security controls
- Recommended security investments
- Expected return/risk reduction from investments
- Executive-level dashboards

The central objective is to answer:

> **"Which cybersecurity risks should the organization address, why are they important, how much could they cost, and where should security investment be allocated?"**

## 1.3 Core Problem

Cybersecurity teams and financial leadership often operate using different measurements.

### Security teams think in terms of:

```text
CVSS
CVE
CWE
Threats
Vulnerabilities
Endpoints
Alerts
Exposure
Controls
```

### Executives think in terms of:

```text
Financial Loss
Business Impact
Risk
Budget
ROI
Investment
Risk Reduction
```

Aegis-Quant creates a translation layer:

```text
Technical Security Data
        ↓
Risk Analysis
        ↓
Likelihood + Impact
        ↓
Risk Exposure
        ↓
Financial Quantification
        ↓
Expected Annual Loss
        ↓
Investment Optimization
        ↓
Executive Decision Support
```

## 1.4 Primary Goals

The application must:

1. Aggregate cybersecurity risk information.
2. Maintain an inventory of organizational assets.
3. Track vulnerabilities and threats.
4. Calculate likelihood.
5. Calculate business impact.
6. Calculate inherent risk.
7. Model security controls.
8. Calculate residual risk.
9. Estimate Expected Annual Loss (EAL).
10. Rank risks according to organizational exposure.
11. Recommend remediation actions.
12. Model cybersecurity investments.
13. Estimate risk reduction produced by investments.
14. Provide executive and technical dashboards.
15. Provide explainable AI-assisted analysis.

## 1.5 Important Design Principle

Aegis-Quant MUST NOT treat CVSS as the final organizational risk score.

CVSS is one input.

The platform must consider contextual information such as:

```text
Vulnerability Severity
+
Exploitability
+
Threat Activity
+
Asset Exposure
+
Asset Criticality
+
Data Sensitivity
+
Business Impact
+
Security Controls
+
Historical Incidents
+
Financial Consequences
```

## 1.6 Risk Model

The initial risk engine must use a transparent and explainable model.

### Likelihood

Normalize relevant factors to a 0–100 scale.

Example:

```text
Likelihood =
    0.30 × Exploitability
  + 0.25 × ThreatActivity
  + 0.20 × Exposure
  + 0.15 × VulnerabilitySeverity
  + 0.10 × HistoricalIncidentFrequency
```

All inputs must be normalized to:

```text
0–100
```

The exact weights must be stored in configuration rather than hard-coded throughout the application.

### Impact

Initial model:

```text
Impact =
    0.30 × FinancialImpact
  + 0.25 × DataSensitivity
  + 0.20 × BusinessCriticality
  + 0.15 × RegulatoryImpact
  + 0.10 × AvailabilityImpact
```

Every component must be normalized to:

```text
0–100
```

### Risk Exposure

Use:

```text
RiskExposure =
    Likelihood × Impact / 100
```

Result:

```text
0–100
```

Example:

```text
Likelihood = 90
Impact = 85

RiskExposure =
90 × 85 / 100

= 76.5
```

## 1.7 Risk Classification

Use the following initial classification:

| Score | Classification |
|---:|---|
| 0–20 | Low |
| >20–40 | Moderate |
| >40–60 | High |
| >60–80 | Very High |
| >80–100 | Critical |

These thresholds MUST be configurable.

Do not scatter threshold values throughout frontend components.

Store them in the risk configuration.

## 1.8 Inherent vs Residual Risk

The application must distinguish:

```text
INHERENT RISK
    ↓
Security Controls
    ↓
RESIDUAL RISK
```

### Inherent Risk

Risk before considering existing controls.

### Residual Risk

Risk remaining after considering the effectiveness of implemented controls.

The system must never overwrite inherent risk when calculating residual risk.

Both values must be preserved.

## 1.9 Expected Annual Loss

Aegis-Quant must support financial risk quantification.

Initial model:

```text
EAL =
Annualized Incident Frequency
×
Expected Loss Per Incident
```

Example:

```text
Incident Frequency = 0.25/year
Loss Magnitude = ₹40,00,000

EAL =
0.25 × ₹40,00,000

= ₹10,00,000/year
```

The system must support:

- INR
- USD
- Configurable currency

The currency must be stored explicitly rather than inferred.

## 1.10 Investment Optimization

Aegis-Quant must eventually answer:

```text
"If we invest ₹X in security,
how much risk could we reduce?"
```

Example:

```text
Current EAL:
₹18,00,000/year

Security Investment:
₹5,00,000

Expected Residual EAL:
₹8,00,000/year

Expected Risk Reduction:
₹10,00,000/year
```

The investment engine may calculate:

```text
Risk Reduction =
Current Risk - Residual Risk
```

and:

```text
Estimated Financial Benefit =
Current EAL - Residual EAL
```

The platform must clearly distinguish:

- Investment Cost
- Expected Risk Reduction
- Expected EAL Reduction
- ROI / benefit-cost metric

Do not claim that the model produces guaranteed financial outcomes.

All financial outputs are estimates based on configured assumptions.

---

# 2. TECH STACK & ARCHITECTURE

## 2.1 Architecture

Use a modular full-stack architecture:

```text
┌─────────────────────────────────────────────┐
│              AEGIS-QUANT UI                 │
│                                             │
│ Next.js + TypeScript + TailwindCSS          │
│ React + Recharts + shadcn/ui                │
└──────────────────┬──────────────────────────┘
                   │
                   │ REST / JSON
                   ↓
┌─────────────────────────────────────────────┐
│              API LAYER                      │
│                                             │
│ Python + FastAPI                            │
│ Pydantic validation                         │
│ Authentication / Authorization              │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴────────┐
          ↓                 ↓
┌──────────────────┐ ┌────────────────────────┐
│ Risk Engine      │ │ AI Analysis Service    │
│                  │ │                        │
│ Likelihood       │ │ Explainability         │
│ Impact           │ │ Risk summaries         │
│ EAL              │ │ Recommendations        │
│ Residual Risk    │ │ Natural language       │
│ Ranking          │ │                        │
└────────┬─────────┘ └────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────┐
│                 SUPABASE                    │
│                                             │
│ PostgreSQL                                  │
│ Authentication                              │
│ Row Level Security                           │
│ Storage                                     │
└─────────────────────────────────────────────┘
```

## 2.2 Frontend

Use:

```text
Next.js
TypeScript
React
TailwindCSS
shadcn/ui
Lucide React
Recharts
React Hook Form
Zod
TanStack Query
```

Frontend responsibilities:

- UI
- Routing
- Forms
- Dashboard visualization
- Client-side state
- API communication
- Authentication UI
- Risk visualization
- Investment visualization

The frontend MUST NOT contain authoritative business-risk calculations.

Risk calculations belong to the backend/domain layer.

## 2.3 Backend

Use:

```text
Python
FastAPI
Pydantic
SQLAlchemy
Alembic
httpx
pytest
```

Backend responsibilities:

- API
- Validation
- Business logic
- Risk calculations
- EAL calculations
- Risk ranking
- Investment calculations
- Authentication verification
- Database interaction
- AI service orchestration

## 2.4 Database

Use:

```text
Supabase PostgreSQL
```

Supabase services:

- PostgreSQL
- Authentication
- Row Level Security
- Storage where required

Do not duplicate business data in local JSON files once database integration is implemented.

## 2.5 AI Layer

AI must be modular.

Create an abstraction such as:

```text
AIProvider
```

Do not directly couple the entire application to one LLM provider.

Example:

```text
AIProvider
├── OpenAIProvider
├── LocalLLMProvider
└── MockAIProvider
```

The application must be able to operate without AI credentials during development.

A mock provider must be available for testing.

## 2.6 AI Responsibilities

AI may assist with:

- Risk explanation
- Executive summaries
- Risk narratives
- Remediation suggestions
- Investment explanations
- Natural-language querying
- Security insights

AI MUST NOT silently modify authoritative risk calculations.

For example:

```text
Risk Engine:
Risk = 82.4
```

AI cannot arbitrarily change:

```text
82.4 → 91
```

The AI can explain the score but cannot override deterministic calculations unless an explicit human-controlled workflow is implemented.

## 2.7 UI Design Language

Design style:

> **Apple-like enterprise cybersecurity dashboard**

Characteristics:

- Minimal
- Premium
- Clean
- Spacious
- Sophisticated
- High information density without visual clutter
- Rounded cards
- Subtle borders
- Soft shadows
- Strong typography
- Excellent spacing
- Smooth but restrained animations
- Dark/light mode support

Do NOT create:

- Cyberpunk UI
- Excessive neon
- Matrix-style backgrounds
- Excessive glowing elements
- Gaming-style interfaces
- Unnecessary animations

The application should feel like a premium enterprise product.

## 2.8 Responsive Design

Must support:

```text
Desktop
Laptop
Tablet
Mobile
```

Primary optimization target:

```text
1440px desktop
```

The dashboard must remain usable at:

```text
1280px
1024px
768px
390px
```

---

# 3. PROJECT STRUCTURE

The following structure is authoritative.

Do not randomly create files outside the appropriate directory.

```text
aegis-quant/
│
├── ANTIGRAVITY_INSTRUCTIONS.md
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── components.json
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── risks/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── assets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── vulnerabilities/
│   │   │   └── page.tsx
│   │   │
│   │   ├── threats/
│   │   │   └── page.tsx
│   │   │
│   │   ├── controls/
│   │   │   └── page.tsx
│   │   │
│   │   ├── investments/
│   │   │   └── page.tsx
│   │   │
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── risks/
│   │   ├── assets/
│   │   ├── vulnerabilities/
│   │   ├── controls/
│   │   ├── investments/
│   │   └── charts/
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validations.ts
│   │
│   ├── hooks/
│   │   ├── use-risks.ts
│   │   ├── use-assets.ts
│   │   ├── use-vulnerabilities.ts
│   │   └── use-investments.ts
│   │
│   ├── types/
│   │   ├── risk.ts
│   │   ├── asset.ts
│   │   ├── vulnerability.ts
│   │   ├── threat.ts
│   │   ├── control.ts
│   │   └── investment.ts
│   │
│   └── public/
│
├── backend/
│   ├── requirements.txt
│   ├── alembic.ini
│   │
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── risks.py
│   │   │   │   ├── assets.py
│   │   │   │   ├── vulnerabilities.py
│   │   │   │   ├── threats.py
│   │   │   │   ├── controls.py
│   │   │   │   ├── investments.py
│   │   │   │   ├── analytics.py
│   │   │   │   └── ai.py
│   │   │   └── dependencies.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── logging.py
│   │   │
│   │   ├── models/
│   │   │   ├── asset.py
│   │   │   ├── vulnerability.py
│   │   │   ├── threat.py
│   │   │   ├── control.py
│   │   │   ├── risk.py
│   │   │   └── investment.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── asset.py
│   │   │   ├── vulnerability.py
│   │   │   ├── threat.py
│   │   │   ├── control.py
│   │   │   ├── risk.py
│   │   │   └── investment.py
│   │   │
│   │   ├── services/
│   │   │   ├── risk_service.py
│   │   │   ├── asset_service.py
│   │   │   ├── vulnerability_service.py
│   │   │   ├── threat_service.py
│   │   │   ├── control_service.py
│   │   │   ├── investment_service.py
│   │   │   └── ai_service.py
│   │   │
│   │   ├── risk_engine/
│   │   │   ├── __init__.py
│   │   │   ├── likelihood.py
│   │   │   ├── impact.py
│   │   │   ├── exposure.py
│   │   │   ├── residual_risk.py
│   │   │   ├── eal.py
│   │   │   ├── ranking.py
│   │   │   └── configuration.py
│   │   │
│   │   ├── ai/
│   │   │   ├── provider.py
│   │   │   ├── mock_provider.py
│   │   │   └── prompts.py
│   │   │
│   │   └── db/
│   │       ├── database.py
│   │       └── migrations/
│   │
│   └── tests/
│       ├── test_likelihood.py
│       ├── test_impact.py
│       ├── test_risk.py
│       ├── test_eal.py
│       ├── test_ranking.py
│       └── test_investments.py
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── risk-model.md
│   ├── api.md
│   ├── database.md
│   └── deployment.md
│
└── scripts/
    ├── setup.sh
    ├── seed-demo-data.py
    └── health-check.sh
```

---

# 4. ENVIRONMENT SETUP & DEPENDENCIES

## 4.1 Prerequisites

Verify these before implementation:

```text
Node.js
npm
Python
pip
Git
Docker
Supabase account/project
```

Do not silently install system-level dependencies without user approval.

## 4.2 Frontend Initialization

From the repository root:

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

If the command generates files inconsistent with this specification, modify them to match the architecture rather than creating a second frontend.

Install:

```bash
cd frontend

npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install react-hook-form
npm install zod
npm install @hookform/resolvers
npm install recharts
npm install lucide-react
npm install clsx
npm install tailwind-merge
```

Initialize shadcn/ui according to the version-compatible CLI generated by the installed project.

Do not downgrade or replace Next.js merely to satisfy an outdated tutorial.

## 4.3 Backend Initialization

From repository root:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install:

```bash
pip install fastapi
pip install "uvicorn[standard]"
pip install pydantic
pip install pydantic-settings
pip install sqlalchemy
pip install alembic
pip install "psycopg[binary]"
pip install httpx
pip install python-multipart
pip install pytest
pip install pytest-asyncio
```

Freeze dependencies after successful setup:

```bash
pip freeze > backend/requirements.txt
```

Do not manually fabricate package versions.

The lockfile and generated dependency metadata are authoritative after installation.

## 4.4 Environment Variables

Create:

```text
.env.example
```

Required variables:

```env
# Frontend
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=

# Backend
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATABASE_URL=

# AI
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

# Application
APP_ENV=development
LOG_LEVEL=INFO

# Risk Configuration
DEFAULT_CURRENCY=INR
```

Never commit:

```text
.env
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
AI_API_KEY
DATABASE_URL
```

to client-side code.

## 4.5 Environment Rules

The AI agent must:

1. Create `.env.example`.
2. Never invent real credentials.
3. Never commit secrets.
4. Never place server secrets in `NEXT_PUBLIC_*` variables.
5. Validate required environment variables at startup.
6. Provide meaningful configuration errors.

---

# 5. DATABASE DESIGN

The initial database must support the following core entities.

## 5.1 Organizations

```text
organizations
```

Fields:

```text
id
name
industry
currency
created_at
updated_at
```

## 5.2 Users

Use Supabase Authentication.

Application-level profile information may be stored separately.

```text
user_profiles
```

Fields:

```text
id
organization_id
full_name
role
created_at
updated_at
```

## 5.3 Assets

```text
assets
```

Fields:

```text
id
organization_id
name
asset_type
description
criticality
business_value
data_sensitivity
internet_exposed
owner
environment
status
created_at
updated_at
```

Examples:

```text
Payment API
Customer Database
Employee Laptop
Admin Portal
Production Server
Cloud Storage
```

## 5.4 Vulnerabilities

```text
vulnerabilities
```

Fields:

```text
id
asset_id
cve_id
name
description
cvss_score
exploitability_score
severity
patch_available
exploit_available
discovered_at
resolved_at
status
created_at
updated_at
```

## 5.5 Threats

```text
threats
```

Fields:

```text
id
organization_id
name
description
threat_type
activity_level
source
first_seen
last_seen
created_at
```

## 5.6 Security Controls

```text
controls
```

Fields:

```text
id
organization_id
name
control_type
description
effectiveness
coverage
status
created_at
updated_at
```

Examples:

```text
WAF
EDR
MFA
Encryption
Network Segmentation
Backup
IAM
SIEM
```

## 5.7 Risks

```text
risks
```

Fields:

```text
id
organization_id
asset_id
vulnerability_id
threat_id

likelihood
impact
inherent_risk

control_effectiveness
residual_risk

annual_frequency
loss_magnitude
eal

risk_level
risk_status

calculation_version
created_at
updated_at
```

## 5.8 Investments

```text
investments
```

Fields:

```text
id
organization_id
name
description
category
cost
implementation_time
expected_likelihood_reduction
expected_impact_reduction
expected_risk_reduction
expected_eal_reduction
roi
status
created_at
updated_at
```

## 5.9 Auditability

Risk calculations must be reproducible.

Every calculated risk should store:

```text
calculation_version
```

When the risk model changes:

```text
v1
v2
v3
```

Do not silently recalculate historical records using a new model.

---

# 6. API DESIGN

Base URL:

```text
/api/v1
```

Endpoints:

```text
GET    /health

GET    /assets
POST   /assets
GET    /assets/{id}
PUT    /assets/{id}
DELETE /assets/{id}

GET    /vulnerabilities
POST   /vulnerabilities
GET    /vulnerabilities/{id}

GET    /threats
POST   /threats

GET    /controls
POST   /controls
PUT    /controls/{id}

GET    /risks
POST   /risks/calculate
GET    /risks/{id}
POST   /risks/{id}/recalculate

GET    /investments
POST   /investments
POST   /investments/optimize

GET    /analytics/overview

POST   /ai/risk-summary
POST   /ai/recommendation
```

All endpoints must use Pydantic schemas.

---

# 7. CODING STANDARDS & CONVENTIONS

## 7.1 General

Use:

```text
Clean Code
SOLID principles
Separation of concerns
DRY where appropriate
Explicit dependencies
Small functions
Meaningful names
```

Do not over-engineer.

Do not introduce unnecessary frameworks.

## 7.2 TypeScript

Use strict TypeScript.

Avoid:

```typescript
any
```

unless absolutely unavoidable and explicitly justified.

Prefer:

```typescript
unknown
```

with validation.

All API responses must have defined types.

## 7.3 React

Use functional components.

Prefer:

```tsx
export function RiskCard() {}
```

Do not use class components.

Components must have a single clear responsibility.

## 7.4 Next.js

Use the App Router.

Prefer Server Components by default.

Use:

```text
"use client"
```

only when client-side interactivity is required.

Do not make every component a Client Component.

## 7.5 Python

Use:

```text
PEP 8
Type hints
Pydantic validation
Meaningful exceptions
Small functions
```

Example:

```python
def calculate_risk(
    likelihood: float,
    impact: float,
) -> float:
    ...
```

## 7.6 Error Handling

Backend errors must return structured responses.

Example:

```json
{
  "success": false,
  "error": {
    "code": "RISK_CALCULATION_FAILED",
    "message": "Unable to calculate risk."
  }
}
```

Never expose:

- Stack traces
- Database credentials
- API keys
- Internal secrets

to frontend users.

## 7.7 Logging

Use structured logging.

Log:

```text
timestamp
level
service
request_id
event
message
```

Do not log:

```text
passwords
tokens
API keys
service-role keys
sensitive user information
```

## 7.8 Comments

Do not comment obvious code.

Comment:

- Risk formulas
- Financial calculations
- Complex algorithms
- Non-obvious security decisions
- External API workarounds

## 7.9 Naming

Use:

```text
camelCase
```

for TypeScript variables/functions.

Use:

```text
PascalCase
```

for React components/types.

Use:

```text
snake_case
```

for Python functions/variables and database fields.

---

# 8. UI / UX REQUIREMENTS

## 8.1 Main Navigation

Sidebar:

```text
Aegis-Quant
────────────────────

Overview
Dashboard

Risk
├── Risk Register
├── Risk Heatmap
└── Risk Analysis

Security
├── Assets
├── Vulnerabilities
├── Threats
└── Controls

Financial
├── Investments
├── EAL Analysis
└── Optimization

Analytics

Settings
```

## 8.2 Executive Dashboard

The dashboard should immediately communicate:

```text
Total Risk Exposure
Critical Risks
High Risks
Total EAL
Residual EAL
Risk Reduction
Security Investment
```

Example:

```text
┌─────────────────────────────────────────────┐
│ Total Risk Exposure       72.4              │
│ Very High                                    │
└─────────────────────────────────────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐
│ Critical   │ │ Total EAL  │ │ Investment │
│    12      │ │ ₹18.4 L    │ │ ₹7.2 L     │
└────────────┘ └────────────┘ └────────────┘
```

## 8.3 Risk Heatmap

Create a visual matrix:

```text
             IMPACT
          Low → Critical

Likelihood
High       │ 🟠 🔴 🔴 🔴
           │ 🟡 🟠 🔴 🔴
           │ 🟢 🟡 🟠 🔴
Low        │ 🟢 🟢 🟡 🟠
```

The actual visualization must use the configured risk thresholds.

## 8.4 Risk Register

Columns:

```text
Risk
Asset
Vulnerability
Likelihood
Impact
Inherent Risk
Residual Risk
EAL
Risk Level
Status
```

Allow:

```text
Search
Filter
Sort
Pagination
Risk-level filtering
Asset filtering
```

## 8.5 Risk Detail Page

Display:

```text
Risk Name

Risk Score
Risk Level

Likelihood
Impact

Inherent Risk
Residual Risk

EAL

Risk Drivers

Affected Asset

Associated Vulnerability

Associated Threat

Security Controls

Recommended Actions

AI Explanation

Investment Options
```

## 8.6 Investment Page

Display:

```text
Current Risk
Current EAL

Investment Cost

Expected Risk Reduction

Expected EAL Reduction

Residual Risk

Residual EAL

ROI / Benefit-Cost Metric
```

Include scenario comparison.

Example:

```text
OPTION A
Patch critical vulnerability

Cost: ₹2L
Risk Reduction: 31
EAL Reduction: ₹7L

OPTION B
Deploy WAF

Cost: ₹5L
Risk Reduction: 42
EAL Reduction: ₹10L
```

Do not automatically declare one option "best."

Present measurable differences and let the user decide.

---

# 9. STEP-BY-STEP IMPLEMENTATION PLAN

# PHASE 1 — PROJECT INITIALIZATION & CONFIGURATION

## Objective

Create a clean, runnable foundation.

### Tasks

1. Initialize Git.
2. Create frontend.
3. Create backend.
4. Create database directory.
5. Create documentation directory.
6. Configure TypeScript.
7. Configure TailwindCSS.
8. Configure linting.
9. Configure Python virtual environment.
10. Install dependencies.
11. Create `.env.example`.
12. Configure environment loading.
13. Create FastAPI health endpoint.
14. Start Next.js.
15. Verify frontend.
16. Verify backend.
17. Verify Git status.

### Required checks

Frontend:

```bash
npm run dev
```

Backend:

```bash
uvicorn app.main:app --reload
```

Health endpoint:

```text
GET /api/v1/health
```

Expected:

```json
{
  "status": "ok"
}
```

### Completion condition

Do not continue until:

```text
Frontend starts successfully
Backend starts successfully
TypeScript has no errors
Python imports successfully
Environment validation works
Health endpoint works
Git repository is clean enough for Phase 1 commit
```

---

# PHASE 2 — UI SHELL & ROUTING

## Objective

Create the complete application shell before implementing complex functionality.

### Tasks

Build:

```text
Sidebar
Top navigation
User menu
Theme system
Page container
Responsive layout
Loading states
Error states
Empty states
```

Create routes:

```text
/login
/dashboard
/risks
/risks/[id]
/assets
/assets/[id]
/vulnerabilities
/threats
/controls
/investments
/analytics
/settings
```

Create reusable UI components:

```text
Button
Card
Badge
Table
Modal
Dialog
Dropdown
Input
Select
Tabs
Tooltip
Skeleton
Alert
```

### Completion condition

Every major route must render.

No route should display:

```text
404
blank screen
unstyled placeholder
```

---

# PHASE 3 — CORE LOGIC & DATABASE

## Objective

Implement the domain model and deterministic risk engine.

### Step 1

Create database schema.

### Step 2

Create SQLAlchemy models.

### Step 3

Create Pydantic schemas.

### Step 4

Implement repositories/services.

### Step 5

Implement risk engine.

Modules:

```text
likelihood.py
impact.py
exposure.py
residual_risk.py
eal.py
ranking.py
```

### Step 6

Write unit tests.

Test:

```text
Likelihood calculation
Impact calculation
Risk calculation
Risk classification
Residual risk
EAL
Risk ranking
```

## PHASE 3 RISK ENGINE TEST EXAMPLE

Input:

```text
Exploitability = 90
Threat Activity = 80
Exposure = 100
Vulnerability Severity = 98
Historical Incidents = 70
```

Expected likelihood:

```text
89.7
```

Input:

```text
Financial Impact = 90
Data Sensitivity = 95
Business Criticality = 100
Regulatory Impact = 80
Availability Impact = 70
```

Expected impact:

```text
89.25
```

Expected exposure:

```text
80.05 approximately
```

Floating-point comparisons must use appropriate tolerance rather than exact binary equality.

---

# PHASE 4 — FEATURE IMPLEMENTATION

Implement features in this order.

## Feature 1 — Authentication

Implement:

```text
Login
Logout
Session
Protected routes
Organization context
Role-aware access
```

Roles:

```text
Admin
Security Analyst
Executive
Viewer
```

Do not build complex RBAC until basic authentication works.

## Feature 2 — Asset Inventory

Implement:

```text
Create Asset
Read Asset
Update Asset
Delete Asset
Search Asset
Filter Asset
Asset Details
```

Asset criticality must support:

```text
Low
Medium
High
Critical
```

## Feature 3 — Vulnerability Management

Implement:

```text
Vulnerability list
Vulnerability details
CVSS
Exploitability
Patch status
Asset association
```

## Feature 4 — Threat Management

Implement:

```text
Threat list
Threat activity
Threat type
Threat source
Asset/threat relationship
```

## Feature 5 — Security Controls

Implement:

```text
Control inventory
Control effectiveness
Control coverage
Control status
Risk-control relationship
```

## Feature 6 — Risk Calculation

Create workflow:

```text
Asset
+
Vulnerability
+
Threat
+
Business Context
+
Controls
        ↓
Risk Engine
        ↓
Likelihood
        ↓
Impact
        ↓
Inherent Risk
        ↓
Control Adjustment
        ↓
Residual Risk
        ↓
EAL
```

## Feature 7 — Risk Ranking

Retrieve all organizational risks.

Calculate ranking using:

```text
Residual Risk
EAL
Business Criticality
```

The ranking algorithm must be deterministic and explainable.

Do not use arbitrary AI-generated ranking.

## Feature 8 — AI Risk Explanation

Input:

```text
Risk data
Asset
Threat
Vulnerability
Controls
Financial impact
```

AI output:

```text
Risk Summary
Primary Risk Drivers
Potential Business Consequences
Recommended Actions
Executive Explanation
```

AI output must be clearly labeled as AI-generated.

## Feature 9 — Investment Optimization

Allow users to define:

```text
Security Investment
Cost
Expected Control Effectiveness
Expected Risk Reduction
Implementation Time
```

Calculate scenarios.

Example:

```text
Current Risk
Current EAL
        ↓
Investment
        ↓
Expected Control Improvement
        ↓
Residual Risk
Residual EAL
        ↓
Financial Difference
```

---

# PHASE 5 — REFACTORING & TESTING

## 5.1 Backend Tests

Minimum coverage areas:

```text
Risk calculations
EAL calculations
Investment calculations
API validation
Database operations
Authentication
Authorization
```

## 5.2 Frontend Tests

Test:

```text
Dashboard rendering
Risk table
Risk filtering
Forms
Validation
Error states
Loading states
Navigation
```

## 5.3 Integration Tests

Test complete flow:

```text
Create Asset
      ↓
Create Vulnerability
      ↓
Create Threat
      ↓
Create Control
      ↓
Calculate Risk
      ↓
Calculate EAL
      ↓
Display Risk
      ↓
Create Investment
      ↓
Calculate Expected Risk Reduction
```

---

# 10. DEMO DATA

The project must contain realistic synthetic demo data.

Do NOT use real organizations or real sensitive information.

Create example assets:

```text
Payment API
Customer Database
Admin Portal
Employee Endpoint
Cloud Storage
Production Web Server
```

Example vulnerabilities:

```text
SQL Injection
Remote Code Execution
Authentication Bypass
Misconfigured Storage
Outdated Dependency
```

Example controls:

```text
WAF
EDR
MFA
Encryption
Network Segmentation
SIEM
Backup
```

Example threats:

```text
External Attacker
Credential Theft
Ransomware
Insider Threat
Supply Chain Attack
```

All demo information must be clearly synthetic.

---

# 11. SECURITY REQUIREMENTS

Security is a core feature.

Implement:

```text
Input validation
Authentication
Authorization
RLS
Secure API design
Secret management
CORS configuration
Rate limiting where appropriate
Structured logging
Error sanitization
```

Never:

```text
Hard-code secrets
Expose service-role keys
Trust client-provided organization IDs
Trust client-provided risk scores
Execute arbitrary user input
Store plaintext passwords
```

---

# 12. DATA INTEGRITY RULES

The backend is authoritative for:

```text
Likelihood
Impact
Risk
Residual Risk
EAL
Investment calculations
```

The frontend must never be trusted to provide authoritative values.

For example, this request is NOT trusted:

```json
{
  "risk_score": 100
}
```

The backend must calculate the risk from the underlying data.

---

# 13. EXPLAINABILITY REQUIREMENTS

Every calculated risk should be explainable.

Example:

```text
Risk Score: 82.4

Primary Drivers:

1. Internet-facing asset
2. High exploitability
3. Critical business asset
4. Sensitive customer data
5. Active threat activity

Controls:

MFA: 90% effectiveness
WAF: 70% effectiveness
EDR: 80% effectiveness
```

The user should be able to understand:

```text
WHY is this risk high?
```

without needing to inspect source code.

---

# 14. ERROR / LOADING / EMPTY STATES

Every data-driven page must implement:

### Loading

```text
Skeleton UI
```

### Error

```text
Clear error message
Retry button
```

### Empty

```text
No data found
Helpful explanation
Create/Add button where appropriate
```

Never leave blank screens.

---

# 15. PERFORMANCE REQUIREMENTS

Avoid:

```text
Unnecessary API calls
Repeated database queries
Unbounded lists
Large client-side datasets
Expensive calculations inside React render
```

Use pagination for large datasets.

Use server-side filtering where appropriate.

Risk calculations should be performed server-side.

---

# 16. DOCUMENTATION REQUIREMENTS

Maintain:

```text
README.md
docs/architecture.md
docs/risk-model.md
docs/api.md
docs/database.md
docs/deployment.md
```

Whenever architecture changes materially, update documentation.

---

# 17. GIT WORKFLOW

Use meaningful commits.

Examples:

```text
feat: initialize frontend
feat: initialize fastapi backend
feat: add database schema
feat: implement risk engine
feat: add asset management
feat: add vulnerability management
feat: add risk dashboard
feat: add investment optimization
test: add risk engine tests
refactor: simplify risk service
fix: validate risk calculation input
```

Do not make one giant commit containing the entire application.

---

# 18. ACCEPTANCE CRITERIA

Aegis-Quant is considered functionally complete when a user can:

```text
1. Sign in
        ↓
2. View organization dashboard
        ↓
3. View assets
        ↓
4. View vulnerabilities
        ↓
5. View threats
        ↓
6. View security controls
        ↓
7. Calculate organizational risk
        ↓
8. View inherent risk
        ↓
9. View residual risk
        ↓
10. View EAL
        ↓
11. See ranked risks
        ↓
12. Open individual risk
        ↓
13. Understand why the risk exists
        ↓
14. Model a security investment
        ↓
15. See expected risk reduction
        ↓
16. See expected financial impact
        ↓
17. Generate an AI explanation
```

---

# 19. AI DIRECTIVES FOR ANTIGRAVITY

## CRITICAL RULES

### RULE 1 — THIS FILE IS THE SOURCE OF TRUTH

Treat:

```text
ANTIGRAVITY_INSTRUCTIONS.md
```

as the authoritative specification.

Do not override architecture based on personal assumptions.

### RULE 2 — DO NOT HALLUCINATE REQUIREMENTS

If something is not specified:

1. Inspect the existing repository.
2. Check related code.
3. Check documentation.
4. Determine whether the missing decision is necessary.
5. If it materially affects architecture, STOP and ask the user.

Never invent:

```text
APIs
credentials
database tables
business requirements
external integrations
risk formulas
financial assumptions
```

### RULE 3 — DO NOT CHANGE THE ARCHITECTURE WITHOUT PERMISSION

Do not replace:

```text
Next.js
FastAPI
Supabase
PostgreSQL
```

with another framework because it appears easier.

Do not introduce:

```text
MongoDB
Django
Express
Firebase
Prisma
Redux
```

unless explicitly authorized.

### RULE 4 — IMPLEMENT PHASES SEQUENTIALLY

The order is:

```text
Phase 1
   ↓
Phase 2
   ↓
Phase 3
   ↓
Phase 4
   ↓
Phase 5
```

Do NOT proceed to the next phase if the current phase is fundamentally broken.

### RULE 5 — TEST BEFORE PROCEEDING

After every meaningful implementation:

```text
Run tests
Run type checks
Run lint
Check imports
Check application startup
```

Fix failures before continuing.

### RULE 6 — DO NOT FABRICATE TEST RESULTS

Never say:

```text
"Tests passed"
```

unless tests were actually executed.

Never claim:

```text
"Build successful"
```

unless the build actually completed successfully.

### RULE 7 — MODIFY SURGICALLY

Prefer small, controlled modifications.

Do not rewrite entire directories when only one file needs modification.

The instruction:

> "Only modify one file at a time"

should be treated as the default strategy for risky or architectural changes.

Multiple files may be modified together only when they form one logically inseparable change and the agent explicitly explains why.

### RULE 8 — INSPECT BEFORE MODIFYING

Before editing an existing file:

```text
Read the file
Understand dependencies
Identify affected components
Make the smallest necessary change
Run validation
```

Never blindly overwrite existing code.

### RULE 9 — PRESERVE WORKING FUNCTIONALITY

When implementing a feature:

```text
Existing functionality
        ↓
New functionality
```

must remain compatible unless a breaking change is explicitly required.

### RULE 10 — NO DUPLICATE SYSTEMS

Before creating:

```text
service
component
utility
hook
API
model
schema
```

search the repository first.

If an equivalent implementation already exists, reuse or refactor it.

Do not create:

```text
risk_service.py
risk_service_v2.py
risk_service_new.py
```

### RULE 11 — BUSINESS LOGIC MUST HAVE ONE AUTHORITATIVE LOCATION

Risk calculations belong in:

```text
backend/app/risk_engine/
```

Do not duplicate the risk formula in:

```text
React
API routes
database triggers
AI prompts
```

unless explicitly required for validation.

### RULE 12 — AI DOES NOT CONTROL DETERMINISTIC RISK

Never allow an LLM to arbitrarily generate:

```text
Risk Score
Likelihood
Impact
EAL
ROI
```

These must come from deterministic calculations.

AI can:

```text
Explain
Summarize
Recommend
Interpret
```

but not silently alter authoritative calculations.

### RULE 13 — FINANCIAL VALUES MUST BE TRANSPARENT

Whenever displaying:

```text
EAL
Loss
ROI
Investment benefit
Risk reduction
```

also provide the underlying assumptions where appropriate.

Never present an estimate as a guaranteed financial outcome.

### RULE 14 — DO NOT USE REAL SENSITIVE DATA

Use synthetic data during development.

Never request or insert:

```text
real credentials
real customer information
real financial records
real secrets
```

into demo data.

### RULE 15 — KEEP SECURITY IN MIND

Every new API endpoint must consider:

```text
Authentication
Authorization
Input validation
Organization isolation
Error handling
Rate limiting where appropriate
```

### RULE 16 — DATABASE CHANGES MUST BE TRACKED

Never silently alter production database structure.

Create migrations for schema changes.

Update:

```text
database/schema.sql
docs/database.md
```

when appropriate.

### RULE 17 — EXPLAIN IMPORTANT DECISIONS

When making an architectural decision, add a concise comment or documentation entry explaining:

```text
What was chosen
Why it was chosen
What alternatives were considered
```

Do not generate unnecessarily long comments.

### RULE 18 — DO NOT OVER-ENGINEER

Build the simplest architecture capable of satisfying this specification.

Do not introduce:

```text
microservices
message brokers
Kubernetes
Redis
Kafka
complex event sourcing
```

unless a demonstrated requirement justifies them.

The initial system should be a modular monolith:

```text
Next.js
        +
FastAPI
        +
Supabase
```

### RULE 19 — DEVELOPMENT ORDER

Always prioritize:

```text
Correctness
Security
Maintainability
Testability
Performance
Visual polish
```

Do not prioritize animations over working risk calculations.

### RULE 20 — WHEN SOMETHING FAILS

Use this sequence:

```text
1. Read the error
2. Identify root cause
3. Inspect affected code
4. Make minimal correction
5. Run the failing test again
6. Run related tests
7. Continue only after validation
```

Do not randomly change dependencies to make an error disappear.

---

# 20. AGENT EXECUTION PROTOCOL

At the beginning of every session:

```text
1. Read ANTIGRAVITY_INSTRUCTIONS.md
2. Inspect repository structure
3. Determine current implementation phase
4. Inspect git status
5. Identify incomplete work
6. Run relevant tests
7. Continue only from the current state
```

Do not restart the project from scratch if an implementation already exists.

---

# 21. RESPONSE FORMAT FOR ANTIGRAVITY

Before implementing a significant feature, briefly report:

```text
CURRENT PHASE:
Phase X

OBJECTIVE:
What will be implemented.

FILES TO CHANGE:
List files.

DEPENDENCIES:
Any required dependency changes.

IMPLEMENTATION:
Short description.

VALIDATION:
Tests/checks that will be executed.
```

After implementation:

```text
STATUS:
Completed / Blocked

FILES CHANGED:
...

TESTS:
...

RESULT:
...

NEXT STEP:
...
```

Do not provide long explanations unless requested.

---

# 22. FINAL DEFINITION OF AEGIS-QUANT

Aegis-Quant is NOT simply:

```text
A vulnerability scanner
```

It is NOT simply:

```text
A SIEM
```

It is NOT simply:

```text
An AI chatbot
```

It is NOT simply:

```text
A risk heatmap
```

The intended product is:

```text
             CYBERSECURITY DATA
                     │
                     ↓
          ┌─────────────────────┐
          │   RISK ENGINE       │
          │                     │
          │ Likelihood          │
          │ Impact              │
          │ Exposure            │
          │ Controls            │
          │ Residual Risk       │
          └──────────┬──────────┘
                     ↓
             FINANCIAL MODEL
                     │
                     ↓
                   EAL
                     │
                     ↓
            RISK PRIORITIZATION
                     │
                     ↓
          INVESTMENT OPTIMIZATION
                     │
                     ↓
             EXECUTIVE DECISION
```

The ultimate product question is:

> **"Given the organization's current cyber exposure, which risks matter most financially, what controls can reduce them, and how should limited cybersecurity capital be allocated?"**

Every major feature should contribute to answering this question.

---

# END OF ANTIGRAVITY_INSTRUCTIONS.md
