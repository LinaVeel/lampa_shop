from pathlib import Path

from psycopg import connect

from app.config import settings


def run() -> None:
    sql_path = Path(__file__).resolve().parents[1] / "migrations" / "001_init.sql"
    sql = sql_path.read_text(encoding="utf-8")

    with connect(settings.database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()

    print("Migration 001_init.sql applied")


if __name__ == "__main__":
    run()
