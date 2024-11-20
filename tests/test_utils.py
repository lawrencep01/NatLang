import pytest
from unittest.mock import patch, MagicMock
from utils import fetch_table_schema, fetch_table_list, get_table_name, get_where_clause, get_new_rows

# Mock cursor class allowing for data to be dynamically passed
class MockCursor:
    def __init__(self, mock_data=None):
        self.mock_data = mock_data or {}
        self.executed_query = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def execute(self, query, params=None):
        self.executed_query = query

    def fetchall(self):
        if "information_schema.columns" in self.executed_query:
            return self.mock_data.get("fetch_schema", [])
        elif "information_schema.tables" in self.executed_query:
            return self.mock_data.get("fetch_tables", [])
        return []

    def close(self):
        pass

# Mock connection class allowing for data to be dynamically passed
class MockConnection:
    def __init__(self, mock_data=None):
        self.mock_data = mock_data or {}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def cursor(self):
        # Pass mock data to MockCursor
        return MockCursor(mock_data=self.mock_data)

    def close(self):
        pass


# Test for fetch_table_schema
def test_fetch_table_schema(mocker):
    mock_data = {
        "fetch_schema": [
            {"table_name": "users", "column_name": "id", "data_type": "integer"},
            {"table_name": "users", "column_name": "name", "data_type": "text"},
            {"table_name": "orders", "column_name": "order_id", "data_type": "integer"},
            {"table_name": "orders", "column_name": "amount", "data_type": "float"},
        ]
    }

    # Patch the database connection
    mocker.patch('utils.get_db_connection', return_value=MockConnection(mock_data))

    # Call the function to test
    schema = fetch_table_schema()

    # Expected schema output
    expected_schema = (
        "users: id (integer), name (text)\n"
        "orders: order_id (integer), amount (float)\n"
    )
    # Assertion
    assert schema == expected_schema


# Test for fetch_table_list
def test_fetch_table_list(mocker):
    mock_data = {
        "fetch_tables": [
            {"table_name": "users"},
            {"table_name": "orders"},
            {"table_name": "products"},
        ]
    }

    # Patch the database connection
    mocker.patch('utils.get_db_connection', return_value=MockConnection(mock_data))

    # Call the function to test
    tables = fetch_table_list()

    # Expected table list
    expected_tables = ["users", "orders", "products"]

    # Assertion
    assert tables == expected_tables


# Test for get_table_name
@pytest.mark.parametrize("query,expected_table", [
    ("INSERT INTO users (id, name) VALUES (1, 'John')", "users"),
    ("DELETE FROM orders WHERE order_id = 123", "orders"),
    ("UPDATE products SET price = 19.99 WHERE id = 1", "products"),
    ("SELECT * FROM customers WHERE id = 10", "customers"),
])
def test_get_table_name(query, expected_table):
    table_name = get_table_name(query)
    assert table_name == expected_table


# Test for get_where_clause
@pytest.mark.parametrize("query,expected_where_clause", [
    ("DELETE FROM users WHERE id = 1", "id = 1"),
    ("SELECT * FROM orders WHERE order_date > '2023-01-01'", "order_date > '2023-01-01'"),
    ("UPDATE products SET price = 19.99 WHERE id = 42", "id = 42"),
    ("SELECT * FROM customers", ""),  # No WHERE clause
])
def test_get_where_clause(query, expected_where_clause):
    where_clause = get_where_clause(query)
    assert where_clause == expected_where_clause


# Test for get_new_rows
def test_get_new_rows():
    pre = [
        {"id": 1, "name": "John"},
        {"id": 2, "name": "Jane"},
    ]
    post = [
        {"id": 1, "name": "John"},
        {"id": 2, "name": "Jane"},
        {"id": 3, "name": "Alice"},
    ]

    new_rows = get_new_rows(pre, post)

    expected_new_rows = [
        {"id": 3, "name": "Alice"}
    ]

    assert new_rows == expected_new_rows

