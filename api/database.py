import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import NullPool

sqlite_file_name = "/tmp/database.db" if os.environ.get("VERCEL") else "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Récupération de l'URL de base de données depuis l'environnement
database_url = os.environ.get("DATABASE_URL")

# Si on est sur Vercel, l'URL commence souvent par postgres:// mais SQLAlchemy veut postgresql://
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Configuration du moteur
if database_url:
    # Configuration optimisée pour Neon/Vercel (Serverless Postgres)
    engine = create_engine(
        database_url,
        echo=False,
        # pool_pre_ping=True : Vérifie la connexion avant de l'utiliser (évite les erreurs de connexion fermée)
        pool_pre_ping=True,
        # NullPool : Désactive le pooling persistant car Vercel gèle les processus entre les requêtes.
        # Cela force une nouvelle connexion propre à chaque requête, ce qui est mieux pour le Serverless.
        poolclass=NullPool 
    )
else:
    # Configuration SQLite (Local / Fallback)
    engine = create_engine(
        sqlite_url, 
        echo=True, 
        connect_args={"check_same_thread": False}
    )

def create_db_and_tables():
    # On crée les tables uniquement si elles n'existent pas
    # Note: En production, il vaut mieux utiliser Alembic pour les migrations, 
    # mais create_all est acceptable pour ce projet.
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
