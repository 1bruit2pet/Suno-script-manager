import os
from sqlmodel import SQLModel, create_engine, Session

sqlite_file_name = "/tmp/database.db" if os.environ.get("VERCEL") else "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Récupération de l'URL de base de données depuis l'environnement (Vercel)
database_url = os.environ.get("DATABASE_URL")

# Si on est sur Vercel, l'URL commence souvent par postgres:// mais SQLAlchemy veut postgresql://
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Utilisation de Postgres si dispo (Prod), sinon SQLite (Local)
engine_url = database_url if database_url else sqlite_url
connect_args = {"check_same_thread": False} if not database_url else {}

engine = create_engine(engine_url, echo=True, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session