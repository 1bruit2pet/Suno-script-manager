from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from main import app, get_session
import pytest

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_create_script(client: TestClient):
    response = client.post(
        "/scripts/",
        json={"title": "Test Song", "lyrics": "La la la", "style": "Pop"},
    )
    data = response.json()
    assert response.status_code == 200
    assert data["title"] == "Test Song"
    assert data["lyrics"] == "La la la"
    assert data["style"] == "Pop"
    assert "id" in data

def test_read_scripts(client: TestClient):
    client.post(
        "/scripts/",
        json={"title": "Song 1", "lyrics": "Lyrics 1"},
    )
    client.post(
        "/scripts/",
        json={"title": "Song 2", "lyrics": "Lyrics 2"},
    )
    response = client.get("/scripts/")
    data = response.json()
    assert response.status_code == 200
    assert len(data) == 2

def test_read_script(client: TestClient):
    response = client.post(
        "/scripts/",
        json={"title": "Unique Song", "lyrics": "Unique Lyrics"},
    )
    script_id = response.json()["id"]
    
    response = client.get(f"/scripts/{script_id}")
    data = response.json()
    assert response.status_code == 200
    assert data["title"] == "Unique Song"

def test_update_script(client: TestClient):
    response = client.post(
        "/scripts/",
        json={"title": "Old Title", "lyrics": "Old Lyrics"},
    )
    script_id = response.json()["id"]
    
    response = client.patch(
        f"/scripts/{script_id}",
        json={"title": "New Title"},
    )
    data = response.json()
    assert response.status_code == 200
    assert data["title"] == "New Title"
    assert data["lyrics"] == "Old Lyrics"

def test_delete_script(client: TestClient):
    response = client.post(
        "/scripts/",
        json={"title": "Delete Me", "lyrics": "..."}
    )
    script_id = response.json()["id"]
    
    response = client.delete(f"/scripts/{script_id}")
    assert response.status_code == 200
    
    response = client.get(f"/scripts/{script_id}")
    assert response.status_code == 404
