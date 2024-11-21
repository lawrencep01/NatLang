import pytest
from unittest.mock import patch, MagicMock
from app import app


# Fixture setting up a Flask test client yielded to the tests
@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

# MOck cursor class for simulating cursor behavior
class MockCursor:
    def __init__(self, mock_data=None):
        self.mock_data = mock_data or {} # Initialize with mock data or an empty dict
        self.executed_query = None # Store the executed query

    # Context management
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass
    
    # Store the executed query
    def execute(self, query, params=None):
        self.executed_query = query

    # Returns the mock data based on the executed query
    def fetchall(self):
        query_str = str(self.executed_query)
        if "information_schema.columns" in query_str:
            return self.mock_data.get("fetch_schema", [])
        elif "SELECT * FROM" in query_str:
            return self.mock_data.get("sample_data", [])
        return []

    # Returns mock row count
    def fetchone(self):
        query_str = str(self.executed_query)
        if "COUNT(*)" in query_str:
            return {"count": self.mock_data.get("row_count", 0)}
        return None

    def close(self):
        pass

# Mock connection class for simulating connection behavior
class MockConnection:
    def __init__(self, mock_data=None):
        self.mock_data = mock_data or {}

    # Context management
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass
    
    # Return a mock cursor with mock data
    def cursor(self, cursor_factory=None): 
        return MockCursor(mock_data=self.mock_data)

    def close(self):
        pass


# Tests status route
def test_status(client):
    response = client.get("/status")
    assert response.status_code == 200
    assert response.get_json() == {"message": "Connected to PostgreSQL database"}

# Tests get_tables route
def test_get_tables(client, mocker):
    mocker.patch('routes.fetch_table_list', return_value=['users', 'orders', 'products'])
    response = client.get("/tables")
    assert response.status_code == 200
    assert response.get_json() == {"tables": ['users', 'orders', 'products']}


def test_get_table_details(client, mocker):
    mock_data = (
        [
            {"name": "id", "type": "integer"},
            {"name": "name", "type": "text"},
        ],
        2,
        [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
    )
    mocker.patch('routes.fetch_table_details', return_value=mock_data)
    #print(mock.call_count)
    #print(mock.call_args_list)
    response = client.get("/table-details/users")
    assert response.status_code == 200
    assert response.get_json() == {
        "name": "users",
        "columns": [
            {"name": "id", "type": "integer"},
            {"name": "name", "type": "text"},
        ],
        "rowCount": 2,
        "data": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
    }


def test_create_query(client, mocker):
    mocker.patch('routes.fetch_db_schema', return_value="users: id (integer), name (text)\n")
    mocker.patch('routes.convert_query', return_value="SELECT * FROM users;")

    mock_data = {
        "sample_data": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    }
    mocker.patch('routes.get_db_connection', return_value=MockConnection(mock_data))

    response = client.post("/queries", json={"query": "Get all users"})
    assert response.status_code == 200
    assert response.get_json() == {
        "results": [
            {
                "Query": "SELECT * FROM users",
                "Results": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
            }
        ]
    }
