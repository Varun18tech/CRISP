#!/usr/bin/env python
"""
Standalone script to seed the database with synthetic demo data.
Run: python scripts/seed-demo-data.py
"""
import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.db.database import SessionLocal, Base, engine
from backend.app.db.seeder import seed_database_if_empty

def main():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        print("Seeding synthetic demo data...")
        seed_database_if_empty(db)
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    main()
