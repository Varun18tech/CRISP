# Aegis-Quant

> **AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVarun18tech%2FCRISP&root-directory=frontend)

Aegis-Quant translates raw technical cybersecurity signals (CVSS, CVEs, assets, threats, controls) into business-oriented financial metrics:
- **Likelihood & Impact** (0–100 scale, weighted and configurable)
- **Risk Exposure** (`Likelihood × Impact / 100`)
- **Inherent Risk vs. Residual Risk** (factoring security control effectiveness and coverage)
- **Expected Annual Loss (EAL)** in INR/USD (`Annual Frequency × Expected Loss`)
- **Investment Optimization & Scenario Modeling** (evaluating risk reduction and financial ROI)
- **Explainable AI Insights** with deterministic business logic foundation

---

## Quickstart Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)

### 1. Backend Setup
```bash
# Set up Python virtual environment
py -3.11 -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```
Health Check: `GET http://localhost:8000/api/v1/health` -> `{"status": "ok"}`
Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation
- [Risk Model Specification](docs/risk-model.md)
- [System Architecture](docs/architecture.md)
- [Database Schema & Seed Data](database/schema.sql)
