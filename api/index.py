import sys
import os

# Fix imports for Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Session, select, SQLModel # SQLModel added here
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

# Helper function to recursively find the 'clip' or 'song' object in JSON
def find_clip_in_json(data):
    if isinstance(data, dict):
        # Check if this dict looks like a song clip
        if "metadata" in data and "title" in data and "id" in data:
            return data
        
        # Recursive search in values
        for key, value in data.items():
            result = find_clip_in_json(value)
            if result:
                return result
    
    elif isinstance(data, list):
        # Recursive search in list
        for item in data:
            result = find_clip_in_json(item)
            if result:
                return result
    
    return None

@app.post("/import-url")
def import_suno_url(request: ImportRequest):
    try:
        # Use a very standard, recent browser User-Agent to avoid bot detection
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://suno.com/",
        }
        
        # Allow redirects
        response = requests.get(request.url, headers=headers, allow_redirects=True)
        print(f"Suno Status Code: {response.status_code}") # Debug
        
        if response.status_code == 403:
             raise HTTPException(status_code=403, detail="Suno blocked the request (Anti-bot). Try manually for now.")
        
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        data = {
            "title": "",
            "style": "",
            "lyrics": "",
            "tags": ""
        }

        # Strategy 1: OpenGraph (Title/Desc)
        og_title = soup.find("meta", property="og:title")
        if og_title:
            title_text = og_title.get("content", "")
            data["title"] = title_text.split(" by ")[0].strip()
        
        # Strategy 2: Regex Brutal V2 (The "Loose" Match)
        # We look for "prompt": "..." but we allow ANY character in between, handling escaped quotes
        text_content = response.text
        
        # Capture lyrics (prompt)
        # Pattern: "prompt":"(content...)" 
        # We use a non-greedy match that stops at the next "," or "}" 
        # But lyrics can contain escaped quotes \", so we need to be careful.
        # Let's try matching a large chunk of text that looks like lyrics.
        
        # Try to find the exact song ID first to narrow down the search
        song_id = request.url.split("/")[-1]
        
        # Find the block containing the ID, then look for prompt nearby
        # This is complex with Regex. Let's stick to finding "prompt" keys.
        
        prompts = re.findall(r'"prompt"\s*:\s*"(.*?)(?<!\\)"', text_content)
        if prompts:
            # Sort by length, lyrics are usually the longest prompt string in the page
            longest = max(prompts, key=len)
            if len(longest) > 20: # Arbitrary threshold to ignore empty prompts
                data["lyrics"] = longest.encode().decode('unicode_escape').replace(r'\n', '\n')

        # Capture tags/style
        tags = re.findall(r'"tags"\s*:\s*"(.*?)(?<!\\)"', text_content)
        if tags:
             # Find non-empty tags
             valid_tags = [t for t in tags if t.strip()]
             if valid_tags:
                 # Prefer the one closest to the prompt if possible, otherwise longest
                 data["style"] = max(valid_tags, key=len).encode().decode('unicode_escape')

        # Fallback: HTML Metadata Description
        og_desc = soup.find("meta", property="og:description")
        if not data["lyrics"]:
             if og_desc:
                 desc = og_desc.get("content", "")
                 if "Song made with Suno" not in desc and len(desc) > 50:
                     data["lyrics"] = desc # Sometimes lyrics are here

        if not data["title"]:
             if soup.title:
                 data["title"] = soup.title.string.split(" | ")[0]

        return data

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Suno song not found. Check the URL.")
        raise HTTPException(status_code=400, detail=f"Suno connection error: {str(e)}")
    except Exception as e:
        print(f"Scraping Error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to analyze page: {str(e)}")

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
