# Aegis-Quant Database Architecture & Schemas

## Database Engine
- **Primary Engine**: Supabase PostgreSQL (or standard PostgreSQL 15+)
- **Local Dev / Testing Engine**: SQLite 3 (via SQLAlchemy connection pooling with zero manual setup required)

## Relational Entity Model
```
┌─────────────────┐       ┌─────────────────┐
│  organizations  │──1:N──│  user_profiles  │
└────────┬────────┘       └─────────────────┘
         │
         ├──1:N──┌─────────────────┐
         │       │     assets      │──1:N──┌──────────────────┐
         │       └────────┬────────┘       │ vulnerabilities  │
         │                │                └────────┬─────────┘
         ├──1:N──┌────────┴────────┐                │
         │       │     threats     │                │
         │       └────────┬────────┘                │
         │                │                         │
         ├──1:N──┌────────┴────────┐                │
         │       │    controls     │                │
         │       └─────────────────┘                │
         │                                          │
         ├──1:N──┌──────────────────────────────────┴────────┐
         │       │                  risks                    │
         │       └───────────────────────────────────────────┘
         │
         └──1:N──┌───────────────────────────────────────────┐
                 │               investments                 │
                 └───────────────────────────────────────────┘
```

## Key Tables
1. **organizations**: Tenant boundary, base currency (`INR`, `USD`).
2. **user_profiles**: User identities, roles (`Admin`, `Security Analyst`, `Executive`, `Viewer`).
3. **assets**: Infrastructure inventory, criticality tiers, business value, exposure.
4. **vulnerabilities**: CVE tracking, CVSS scores, exploitability scores, patch status.
5. **threats**: Threat actors, vectors, activity level telemetry.
6. **controls**: Defensive countermeasures, measured effectiveness %, coverage %.
7. **risks**: Calculated risk records storing:
   - `likelihood` (0–100)
   - `impact` (0–100)
   - `inherent_risk` (0–100)
   - `control_effectiveness` (0–100)
   - `residual_risk` (0–100)
   - `annual_frequency`
   - `loss_magnitude`
   - `eal` (Expected Annual Loss)
   - `calculation_version` (`v1`)
8. **investments**: Modeled security investments, capital cost, expected risk reduction, expected EAL reduction, ROI.

## Auditing & Determinism
Per Section 5.9 of `ANTIGRAVITY_INSTRUCTIONS.md`, all risk records preserve `calculation_version` (`v1`). Historical risk records are never silently updated when underlying models evolve.
