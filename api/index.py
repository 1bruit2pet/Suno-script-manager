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
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # Allow redirects (Suno uses /s/ -> /song/ redirects)
        response = requests.get(request.url, headers=headers, allow_redirects=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        data = {
            "title": "",
            "style": "",
            "lyrics": "",
            "tags": ""
        }

        # Strategy 1: OpenGraph (Title/Desc) - Always a good backup
        og_title = soup.find("meta", property="og:title")
        if og_title:
            title_text = og_title.get("content", "")
            data["title"] = title_text.split(" by ")[0].strip()
        
        # Strategy 2: Deep Scan of Next.js Data
        next_data = soup.find("script", id="__NEXT_DATA__")
        if next_data:
            try:
                json_data = json.loads(next_data.string)
                
                # Use recursive search to find the clip data anywhere
                clip = find_clip_in_json(json_data)
                
                if clip:
                    data["title"] = clip.get("title") or data["title"]
                    metadata = clip.get("metadata", {})
                    data["style"] = metadata.get("tags") or data["style"]
                    data["lyrics"] = metadata.get("prompt") or ""
                    
                    # Sometimes tags are separate
                    if not data["tags"] and data["style"]:
                         data["tags"] = data["style"] # Use style as tags for now

            except Exception as e:
                print(f"Error parsing NEXT_DATA: {e}")

        # Strategy 3: Regex Fallback (Next.js App Router / Streaming)
        # Often data is in self.__next_f.push(...) as escaped strings
        if not data["lyrics"]:
            try:
                # Search for "prompt":"..." pattern
                # Using a robust regex that handles escaped quotes
                prompt_matches = re.findall(r'"prompt":"(.*?)(?<!\\)"', response.text)
                if prompt_matches:
                    # Take the longest match, usually the full lyrics
                    longest_prompt = max(prompt_matches, key=len)
                    # Unescape unicode and newlines
                    data["lyrics"] = longest_prompt.encode().decode('unicode_escape').replace(r'\n', '\n')

                # Search for "tags":"..."
                if not data["style"]:
                    tags_matches = re.findall(r'"tags":"(.*?)(?<!\\)"', response.text)
                    if tags_matches:
                         data["style"] = tags_matches[0].encode().decode('unicode_escape')

            except Exception as e:
                print(f"Regex Fallback Error: {e}")

        # Strategy 4: HTML Fallback (if JSON fails)
        if not data["lyrics"]:
             # Try to find lyrics in standard meta description if not found yet
             og_desc = soup.find("meta", property="og:description")
             if og_desc:
                 desc = og_desc.get("content", "")
                 # If description is long, it might be lyrics. 
                 # Usually Suno puts "Song made with Suno..."
                 if "Song made with Suno" not in desc:
                     # It's likely style or lyrics
                     if not data["style"]:
                         data["style"] = desc

        if not data["title"]:
             # Last resort title
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
