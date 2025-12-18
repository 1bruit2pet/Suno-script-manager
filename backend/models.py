from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class ScriptBase(SQLModel):
    title: str
    lyrics: str
    style: Optional[str] = None
    tags: Optional[str] = None

class Script(ScriptBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScriptCreate(ScriptBase):
    pass

class ScriptRead(ScriptBase):
    id: int
    created_at: datetime

class ScriptUpdate(SQLModel):
    title: Optional[str] = None
    lyrics: Optional[str] = None
    style: Optional[str] = None
    tags: Optional[str] = None
