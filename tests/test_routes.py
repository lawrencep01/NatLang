import pytest
from flask import Flask, jsonify
from flask.testing import FlaskClient
from unittest.mock import patch, MagicMock
from routes import setup_routes
from models import DatabaseConnection

@pytest.fixture
def app():
    app = Flask(__name__)
    setup_routes(app)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_connection(client):
    data = {
        "name": "Test Connection",
        "host": "localhost",
        "port": 5432,
        "database": "test_db",
        "username": "user",
        "password": "password"
    }
    with patch('routes.SessionLocal') as mock_session:
        mock_session_instance = mock_session.return_value
        mock_session_instance.commit.return_value = None
        response = client.post("/connections", json=data)
        assert response.status_code == 201
        assert response.json == {"message": "Connection created successfully"}

def test_get_connections(client):
    with patch('routes.SessionLocal') as mock_session:
        mock_session_instance = mock_session.return_value
        mock_session_instance.query.return_value.all.return_value = [
            DatabaseConnection(id=1, name="Test Connection", host="localhost", port=5432, database="test_db", username="user", password="password")
        ]
        response = client.get("/connections")
        assert response.status_code == 200
        assert response.json == [
            {
                "id": 1,
                "name": "Test Connection",
                "host": "localhost",
                "port": 5432,
                "database": "test_db",
                "username": "user",
                "password": "password"
            }
        ]

def test_update_connection(client):
    data = {
        "name": "Updated Connection"
    }
    with patch('routes.SessionLocal') as mock_session:
        mock_session_instance = mock_session.return_value
        mock_session_instance.query.return_value.filter.return_value.first.return_value = DatabaseConnection(id=1, name="Test Connection", host="localhost", port=5432, database="test_db", username="user", password="password")
        response = client.put("/connections/1", json=data)
        assert response.status_code == 200
        assert response.json == {"message": "Connection updated successfully"}

def test_delete_connection(client):
    with patch('routes.SessionLocal') as mock_session:
        mock_session_instance = mock_session.return_value
        mock_session_instance.query.return_value.filter.return_value.first.return_value = DatabaseConnection(id=1, name="Test Connection", host="localhost", port=5432, database="test_db", username="user", password="password")
        response = client.delete("/connections/1")
        assert response.status_code == 200
        assert response.json == {"message": "Connection deleted successfully"}

def test_get_tables(client):
    with patch('routes.fetch_table_list') as mock_fetch_table_list:
        mock_fetch_table_list.return_value = (["table1", "table2"], "test_db")
        response = client.get("/tables?connection_id=1")
        assert response.status_code == 200
        assert response.json == {"tables": ["table1", "table2"], "databaseName": "test_db"}

def test_get_table_details(client):
    with patch('routes.fetch_table_details') as mock_fetch_table_details:
        mock_fetch_table_details.return_value = (["column1", "column2"], 10, [{"column1": "value1", "column2": "value2"}])
        response = client.get("/table-details/table1?connection_id=1")
        assert response.status_code == 200
        assert response.json == {
            "name": "table1",
            "columns": ["column1", "column2"],
            "rowCount": 10,
            "data": [{"column1": "value1", "column2": "value2"}]
        }

def test_create_query(client):
    data = {
        "query": "SELECT * FROM table1"
    }
    with patch('routes.get_db_connection') as mock_get_db_connection, \
         patch('routes.convert_query') as mock_convert_query, \
         patch('routes.fetch_db_schema') as mock_fetch_db_schema:
        mock_fetch_db_schema.return_value = {"table1": ["column1", "column2"]}
        mock_convert_query.return_value = "SELECT * FROM table1"
        mock_connection = MagicMock()
        mock_cursor = mock_connection.cursor.return_value.__enter__.return_value
        mock_cursor.fetchall.return_value = [{"column1": "value1", "column2": "value2"}]
        mock_get_db_connection.return_value.__enter__.return_value = mock_connection
        response = client.post("/queries?connection_id=1", json=data)
        assert response.status_code == 200
        assert response.json == {"results": [{"Query": "SELECT * FROM table1", "Results": [{"column1": "value1", "column2": "value2"}]}]}