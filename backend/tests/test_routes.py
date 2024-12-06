# test_routes.py
import pytest
from app import create_app
from models import Base, engine


@pytest.fixture(scope="module")
def test_client():
    flask_app = create_app()
    testing_client = flask_app.test_client()

    with flask_app.app_context():
        Base.metadata.create_all(engine)
        yield testing_client
        Base.metadata.drop_all(engine)


def test_create_connection(test_client):
    response = test_client.post(
        "/connections",
        json={
            "name": "Test Connection",
            "host": "postgres-test",
            "port": 5432,
            "username": "test_user",
            "password": "test_password",
            "database": "test_db",
        },
    )
    assert response.status_code == 201
    assert response.json["message"] == "Connection created successfully"


def test_create_connection_invalid_data(test_client):
    response = test_client.post(
        "/connections",
        json={
            "name": "",
            "host": "postgres-test",
            "port": 5432,
            "username": "test_user",
            "password": "test_password",
            "database": "test_db_wrong_name",
        },
    )
    assert response.status_code == 400
    assert "error" in response.json


def test_get_connections(test_client):
    response = test_client.get("/connections")
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0


def test_update_connection(test_client):
    response = test_client.put(
        "/connections/1",
        json={
            "name": "Updated Test Connection",
            "host": "postgres-test",
            "port": 5432,
            "username": "test_user",
            "password": "test_password",
            "database": "test_db",
        },
    )
    assert response.status_code == 200
    assert response.json["message"] == "Connection updated successfully"


def test_get_db_name(test_client):
    response = test_client.get("/db-name?connection_id=1")
    assert response.status_code == 200
    assert "databaseName" in response.json


def test_get_schema(test_client):
    response = test_client.get("/schema?connection_id=1")
    assert response.status_code == 200
    assert "schema" in response.json


def test_get_tables(test_client):
    response = test_client.get("/tables?connection_id=1")
    assert response.status_code == 200
    assert "tables" in response.json
    assert "public" in response.json["tables"]


def test_get_table_details(test_client):
    response = test_client.get("/table-details/test_table?connection_id=1")
    assert response.status_code == 200
    assert "columns" in response.json
    assert any(column["name"] == "id" for column in response.json["columns"])
    assert any(column["name"] == "name" for column in response.json["columns"])


def test_delete_connection(test_client):
    response = test_client.delete("/connections/1")
    assert response.status_code == 200
    assert response.json["message"] == "Connection deleted successfully"
