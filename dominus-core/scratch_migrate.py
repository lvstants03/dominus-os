from sqlalchemy import text
from src.database.connection import get_db_session
from src.config import config

print(f"Connecting to database: {config.DATABASE_URL}")

with get_db_session() as session:
    # Check and add password_hash
    try:
        session.execute(text("ALTER TABLE dominus_users ADD COLUMN password_hash VARCHAR(255);"))
        session.commit()
        print("Success: Added password_hash column to dominus_users")
    except Exception as e:
        session.rollback()
        print(f"Info: password_hash column check/skip: {e}")

    # Check and add face_embedding
    try:
        session.execute(text("ALTER TABLE dominus_users ADD COLUMN face_embedding JSONB;"))
        session.commit()
        print("Success: Added face_embedding column to dominus_users")
    except Exception as e:
        session.rollback()
        print(f"Info: face_embedding column check/skip: {e}")

print("Migration completed.")
