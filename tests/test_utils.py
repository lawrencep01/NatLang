import pytest
from unittest.mock import patch, MagicMock
from utils import (
    fetch_db_schema,
    fetch_table_list,
    fetch_table_details,
    get_table_name,
    get_where_clause,
    get_new_rows,
)

# Mock database connection and cursor
@pytest.fixture
def mock_db_connection():
    with patch("utils.get_db_connection") as mock_get_db_connection:
        mock_conn = MagicMock()
        mock_cursor = mock_conn.cursor.return_value.__enter__.return_value
        mock_get_db_connection.return_value.__enter__.return_value = mock_conn
        yield mock_cursor

def test_fetch_db_schema(mock_db_connection):
    mock_db_connection.fetchall.return_value = [
        {
            "table_name": "users",
            "column_name": "id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": "nextval('users_id_seq'::regclass)",
            "constraint_type": "PRIMARY KEY",
            "key_column": "id",
            "foreign_table": None,
            "foreign_column": None,
        },
        {
            "table_name": "users",
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": None,
            "constraint_type": None,
            "key_column": None,
            "foreign_table": None,
            "foreign_column": None,
        },
    ]
    result = fetch_db_schema("test_connection_id")
    expected = (
        "\nDatabase Schema:\n"
        "users\n"
        "  - id (integer) [Nullable: NO] [Default: nextval('users_id_seq'::regclass)] [Primary Key]\n"
        "  - name (text) [Nullable: YES] [Default: None]\n\n"
    )
    assert result == expected

def test_fetch_table_list(mock_db_connection):
    mock_db_connection.fetchall.side_effect = [
        [{"table_name": "users"}, {"table_name": "orders"}],
    ]
    mock_db_connection.fetchone.return_value = {"current_database": "test_db"}
    tables, database_name = fetch_table_list("test_connection_id")
    assert tables == ["users", "orders"]
    assert database_name == "test_db"

def test_fetch_table_details(mock_db_connection):
    mock_db_connection.fetchall.side_effect = [
        [{"column_name": "id", "data_type": "integer"}, {"column_name": "name", "data_type": "text"}],
        [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
    ]
    mock_db_connection.fetchone.return_value = {"count": 2}
    columns, row_count, data = fetch_table_details("test_connection_id", "users")
    assert columns == [{"name": "id", "type": "integer"}, {"name": "name", "type": "text"}]
    assert row_count == 2
    assert data == [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]

def test_get_table_name():
    query = "SELECT * FROM users WHERE id = 1"
    table_name = get_table_name(query)
    assert table_name == "users"

def test_get_where_clause():
    query = "DELETE FROM users WHERE id = 1"
    where_clause = get_where_clause(query)
    assert where_clause == "id = 1"


def test_get_new_rows():
    pre = [{"id": 1, "name": "Alice"}]
    post = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    new_rows = get_new_rows(pre, post)
    assert new_rows == [{"id": 2, "name": "Bob"}]