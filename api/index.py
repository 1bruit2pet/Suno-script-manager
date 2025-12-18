import sys
import os

# Fix imports for Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Session, select
from typing import List
from contextlib import asynccontextmanager
from database import create_db_and_tables, get_session
from models import Script, ScriptCreate, ScriptRead, ScriptUpdate
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import json
import re

class ImportRequest(SQLModel):
    url: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        create_db_and_tables()
        print("Database initialized successfully.")
    except Exception as e:
        # Si l'erreur mentionne que la relation existe déjà, on ignore, c'est bon signe.
        error_str = str(e).lower()
        if "already exists" in error_str or "uniqueviolation" in error_str:
            print(f"Database schema already exists, skipping creation. (Error: {e})")
        else:
            print(f"WARNING: Database initialization failed: {e}")
            # On continue quand même pour que l'API /health fonctionne
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

@app.post("/import-url")
def import_suno_url(request: ImportRequest):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(request.url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        data = {
            "title": "",
            "style": "",
            "lyrics": "",
            "tags": ""
        }

        # 1. Try OpenGraph tags for basic info
        og_title = soup.find("meta", property="og:title")
        if og_title:
            # Suno titles are often "Song Name by Artist | Suno"
            title_text = og_title["content"]
            data["title"] = title_text.split(" by ")[0].strip()

        og_description = soup.find("meta", property="og:description")
        if og_description:
            desc = og_description["content"]
            # Description often contains style/lyrics snippet
            data["style"] = desc  # Fallback

        # 2. Try to find Next.js hydration data (Suno uses Next.js)
        # This is where the gold is (full lyrics, clean style)
        next_data = soup.find("script", id="__NEXT_DATA__")
        if next_data:
            try:
                json_data = json.loads(next_data.string)
                # Traversing JSON structure is risky as it changes, but let's try generic fallback
                # Often in props -> pageProps -> clip
                queries = json_data.get("props", {}).get("pageProps", {})
                clip = queries.get("clip")
                
                if clip:
                    data["title"] = clip.get("title") or data["title"]
                    data["style"] = clip.get("metadata", {}).get("tags") or data["style"]
                    data["lyrics"] = clip.get("metadata", {}).get("prompt") or ""
            except Exception as e:
                print(f"Error parsing NEXT_DATA: {e}")

        # 3. Fallback: If lyrics still empty, look for specific generic containers
        if not data["lyrics"]:
            # Sometimes lyrics are in a specific div, hard to guess without seeing live DOM
            # But prompt is often in metadata
            pass

        return data

    except Exception as e:
        print(f"Scraping Error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch Suno data: {str(e)}")

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
