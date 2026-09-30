from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.logging import setup_logging, logger
from backend.app.db.database import engine, SessionLocal, Base
from backend.app.db.seeder import seed_database_if_empty
import backend.app.models  # Register all SQLAlchemy models before create_all.

# Import all routers
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.assets import router as assets_router
from backend.app.api.routes.vulnerabilities import router as vulnerabilities_router
from backend.app.api.routes.threats import router as threats_router
from backend.app.api.routes.controls import router as controls_router
from backend.app.api.routes.risks import router as risks_router
from backend.app.api.routes.investments import router as investments_router
from backend.app.api.routes.analytics import router as analytics_router
from backend.app.api.routes.ai import router as ai_router
from backend.app.api.routes.portfolio import router as portfolio_router

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema exists and seed initial demo data
    logger.info("Initializing database schema and seeding demo dataset...")
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database_if_empty(db)
    yield
    logger.info("Shutting down CRISP API server...")

app = FastAPI(
    title="CRISP API",
    description="AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.error(f"Unhandled exception during {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred."
                }
            }
        )

# Required Health Endpoint per Section 6 and Phase 1
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

# Mount all domain routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(assets_router, prefix=api_prefix)
app.include_router(vulnerabilities_router, prefix=api_prefix)
app.include_router(threats_router, prefix=api_prefix)
app.include_router(controls_router, prefix=api_prefix)
app.include_router(risks_router, prefix=api_prefix)
app.include_router(investments_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(portfolio_router, prefix=api_prefix)

@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "api_v1": api_prefix
    }
