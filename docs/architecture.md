# Aegis-Quant System Architecture

## Architecture Overview
Aegis-Quant is architected as a clean, modular monolith:

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js Frontend                      │
│ App Router, TypeScript, TailwindCSS, Lucide Icons, Recharts │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (Client or SSR)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│ Pydantic Validation, FastAPI Routers, Error Handling        │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
                ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   Deterministic Risk Engine  │ │      AI Narrative Layer     │
│ Likelihood, Impact, Residual │ │ Modular AIProvider (Mock,   │
│ Risk, EAL, Ranking           │ │ OpenAI, Anthropic, Gemini)  │
└───────────────┬──────────────┘ └─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                         │
│ PostgreSQL / Supabase with SQLAlchemy ORM (SQLite fallback) │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Components
- `app/layout.tsx`: Root shell with sidebar, header, global styles, and TanStack Query provider.
- `app/dashboard/`: Executive KPI cards, risk exposure meter, high-level matrix preview.
- `app/risks/`: Complete searchable risk register and explainable risk detail pages.
- `app/assets/`: Enterprise IT/OT asset inventory.
- `app/vulnerabilities/`: CVE tracking, CVSS scores, exploit availability.
- `app/threats/`: Threat actors and intelligence telemetry.
- `app/controls/`: Security control effectiveness and coverage monitoring.
- `app/investments/`: Capital allocation and scenario optimization engine.
- `app/analytics/`: Detailed risk distribution and financial exposure analytics.

## Backend Components
- `app/api/routes/`: Distinct REST routers for all business domain entities.
- `app/risk_engine/`: Strict deterministic domain calculations isolated from AI or user inputs.
- `app/ai/`: Pluggable AI provider interface with explainability generators.
- `app/db/`: Connection pooling and database session management.
