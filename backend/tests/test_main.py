import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from app.main import app
from app import models

@pytest.fixture
def mock_crud():
    with patch('app.crud') as mock_crud:
        yield mock_crud

@pytest.mark.anyio
async def test_create_node(mock_crud):
    mock_crud.create_node.return_value = models.Node(labels=["Test"], properties={"name": "test_node"})
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/nodes", json={"labels": ["Test"], "properties": {"name": "test_node"}})
    assert response.status_code == 200
    assert response.json()["properties"]["name"] == "test_node"

@pytest.mark.anyio
async def test_get_node(mock_crud):
    mock_crud.get_node.return_value = models.Node(id="test_id", labels=["Test"], properties={"name": "test_node"})
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/nodes/test_id")
    assert response.status_code == 200
    assert response.json()["id"] == "test_id"

@pytest.mark.anyio
async def test_get_node_not_found(mock_crud):
    mock_crud.get_node.return_value = None
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/nodes/test_id")
    assert response.status_code == 404

# Add more tests for other endpoints...