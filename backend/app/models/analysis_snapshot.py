from sqlalchemy import Column, DateTime, Integer, JSON, String, func

from backend.app.db.database import Base


class AnalysisSnapshot(Base):
    """The latest server-authoritative result of an uploaded company dataset."""

    __tablename__ = "analysis_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_files = Column(JSON, nullable=False, default=list)
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String(32), nullable=False, default="completed")
