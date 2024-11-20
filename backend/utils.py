from database import get_db_connection
from collections import defaultdict
import re


# Fetch table schema data from the database to be used as input for OpenAI's API
def fetch_table_schema():
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                schema_query = """
                SELECT
                    table_name,
                    column_name,
                    data_type
                FROM
                    information_schema.columns
                WHERE
                    table_schema = 'public'
                ORDER BY
                    table_name, ordinal_position;
                """
                cursor.execute(schema_query)
                schema = defaultdict(list)
                for row in cursor.fetchall():
                    table_name = row["table_name"]
                    column_info = f"{row['column_name']} ({row['data_type']})"
                    schema[table_name].append(column_info)
                schema_desc = ""
                for table, columns in schema.items():
                    schema_desc += f"{table}: {', '.join(columns)}\n"
                return schema_desc
    except Exception as e:
        print(f"Error fetching table schema: {e}")
        return None


# Fetch list of all tables in the database
def fetch_table_list():
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                table_query = """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
                """
                cursor.execute(table_query)
                tables = [row["table_name"] for row in cursor.fetchall()]
                return tables
    except Exception as e:
        print(f"Error fetching table list: {e}")
        return []


# Extract table name from INSERT query
def get_table_name(query, query_type):
    pattern = ""
    if query_type == "insert":
        pattern = r"insert\s+into\s+(\w+)"
    elif query_type == "delete":
        pattern = r"delete\s+from\s+(\w+)"
    match = re.search(pattern, query, re.IGNORECASE)
    if match:
        return match.group(1)
    else:
        return ""


# Extract WHERE clause from DELETE query
def get_where_clause(query):
    pattern = r"where\s+(.+)"
    match = re.search(pattern, query, re.IGNORECASE)
    if match:
        return match.group(1)
    else:
        return ""


# Compare before and after states to determine new rows
def get_new_rows(pre, post):
    pre_set = set(tuple(row.items()) for row in pre)
    post_set = set(tuple(row.items()) for row in post)
    new_rows = [dict(row) for row in (post_set - pre_set)]
    return new_rows
