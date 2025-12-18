from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Session, select
from typing import List
from contextlib import asynccontextmanager
from database import create_db_and_tables, get_session
from models import Script, ScriptCreate, ScriptRead, ScriptUpdate
from fastapi.middleware.cors import CORSMiddleware
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

# Configuration pour Vercel : on définit le root_path si on passe par /api
app = FastAPI(lifespan=lifespan, root_path="/api")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://suno-script-manager.vercel.app", # Exemple
    "*" # Autoriser tout pour faciliter le débug initial (à restreindre en prod idéalement)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.post("/scripts/", response_model=ScriptRead)
def create_script(script: ScriptCreate, session: Session = Depends(get_session)):
    try:
        db_script = Script.model_validate(script)
        session.add(db_script)
        session.commit()
        session.refresh(db_script)
        return db_script
    except Exception as e:
        print(f"Error creating script: {e}") # Log for Vercel Console
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@app.get("/scripts/", response_model=List[ScriptRead])
def read_scripts(offset: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    scripts = session.exec(select(Script).offset(offset).limit(limit)).all()
    return scripts

@app.get("/scripts/{script_id}", response_model=ScriptRead)
def read_script(script_id: int, session: Session = Depends(get_session)):
    script = session.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script

@app.patch("/scripts/{script_id}", response_model=ScriptRead)
def update_script(script_id: int, script: ScriptUpdate, session: Session = Depends(get_session)):
    db_script = session.get(Script, script_id)
    if not db_script:
        raise HTTPException(status_code=404, detail="Script not found")
    script_data = script.model_dump(exclude_unset=True)
    db_script.sqlmodel_update(script_data)
    session.add(db_script)
    session.commit()
    session.refresh(db_script)
    return db_script

@app.delete("/scripts/{script_id}")
def delete_script(script_id: int, session: Session = Depends(get_session)):
    script = session.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    session.delete(script)
    session.commit()
    return {"ok": True}