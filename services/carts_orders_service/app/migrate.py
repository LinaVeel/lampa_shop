import psycopg
from app.config import settings


def run() -> None:
    """Run database migrations."""
    with psycopg.connect(settings.database_url) as conn:
        with conn.cursor() as cur:
            with open("/app/migrations/001_init.sql") as f:
                sql = f.read()
            cur.execute(sql)
            conn.commit()
            print("Migrations completed successfully")
