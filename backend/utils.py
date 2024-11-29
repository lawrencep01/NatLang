from database import get_db_connection
from collections import defaultdict
import re
from psycopg2 import sql


# Fetch table schema data from the database to be used as input for OpenAI's API
def fetch_db_schema(connection_id):
    try:
        with get_db_connection(
            connection_id
        ) as connection, connection.cursor() as cursor:
            # Query to fetch table and column schema information
            schema_query = """
                SELECT
                    cols.table_name,
                    cols.column_name,
                    cols.data_type,
                    cols.is_nullable,
                    cols.column_default,
                    tc.constraint_type,
                    ccu.table_name AS foreign_table,
                    ccu.column_name AS foreign_column,
                    pgd.description
                FROM
                    information_schema.columns AS cols
                LEFT JOIN
                    information_schema.key_column_usage AS kcu
                ON
                    cols.table_name = kcu.table_name
                    AND cols.column_name = kcu.column_name
                    AND cols.table_schema = kcu.table_schema
                LEFT JOIN
                    information_schema.table_constraints AS tc
                ON
                    kcu.constraint_name = tc.constraint_name
                    AND kcu.table_schema = tc.table_schema
                LEFT JOIN
                    information_schema.constraint_column_usage AS ccu
                ON
                    tc.constraint_name = ccu.constraint_name
                    AND tc.table_schema = ccu.table_schema
                LEFT JOIN
                    pg_catalog.pg_statio_all_tables AS st
                ON
                    st.schemaname = cols.table_schema
                    AND st.relname = cols.table_name
                LEFT JOIN
                    pg_catalog.pg_description AS pgd
                ON
                    pgd.objoid = st.relid
                    AND pgd.objsubid = cols.ordinal_position
                WHERE
                    cols.table_schema = 'public'
                ORDER BY
                    cols.table_name, cols.ordinal_position;
                """

            cursor.execute(schema_query)
            schema = defaultdict(dict)

            for row in cursor.fetchall():
                table = row["table_name"]
                column = row["column_name"]

                if column not in schema[table]:
                    schema[table][column] = {
                        "name": column,
                        "type": row["data_type"],
                        "nullable": row["is_nullable"] == "YES",
                        "default": row["column_default"],
                        "primary_key": False,
                        "foreign_keys": [],
                        "description": row["description"],
                    }

                # Handle Primary Key
                if row["constraint_type"] == "PRIMARY KEY":
                    schema[table][column]["primary_key"] = True
                    schema[table][column][
                        "nullable"
                    ] = False  # Ensure PK is not nullable

                # Handle Foreign Key
                if (
                    row["constraint_type"] == "FOREIGN KEY"
                    and row["foreign_table"]
                    and row["foreign_column"]
                ):
                    fk = {
                        "table": row["foreign_table"],
                        "column": row["foreign_column"],
                    }
                    if fk not in schema[table][column]["foreign_keys"]:
                        schema[table][column]["foreign_keys"].append(fk)

            # Convert defaultdict to regular dict
            final_schema = {}
            for table, columns in schema.items():
                final_schema[table] = list(columns.values())

            return final_schema
    except Exception:
        return {}


# Fetch a list of all tables in the database
def fetch_table_list(connection_id):
    try:
        with get_db_connection(connection_id) as connection:
            with connection.cursor() as cursor:
                # Query to fetch all tables in the database
                table_query = """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
                """
                cursor.execute(table_query)
                tables = [
                    row["table_name"] for row in cursor.fetchall()
                ]  # Store table names in a list

                # Query to fetch the database name
                cursor.execute("SELECT current_database()")
                database_name = cursor.fetchone()["current_database"]

                return database_name, tables
    except Exception as e:
        print(f"Error fetching table list: {e}")
        return []


def fetch_table_details(connection_id, table_name):
    try:
        with get_db_connection(connection_id) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = %s
                """,
                    (table_name,),
                )

                columns = cursor.fetchall()

                cursor.execute(
                    sql.SQL("SELECT COUNT(*) FROM {}").format(
                        sql.Identifier(table_name)
                    )
                )
                row_count = cursor.fetchone()

                cursor.execute(
                    sql.SQL("SELECT * FROM {}").format(sql.Identifier(table_name))
                )
                data = cursor.fetchall()

                columns = [
                    {"name": col["column_name"], "type": col["data_type"]}
                    for col in columns
                ]
                row_count = row_count["count"] if row_count else 0
                data = [dict(row) for row in data]

                return columns, row_count, data
    except Exception as e:
        print(f"Error fetching table details: {e}")
        return None, None, None


# Extract table name from a query using regex
def get_table_name(query):
    pattern = (
        r"insert\s+into\s+(\w+)|"  # Match "insert into <table>"
        r"delete\s+from\s+(\w+)|"  # Match "delete from <table>"
        r"update\s+(\w+)|"  # Match "update <table>"
        r"from\s+(\w+)"  # Match "from <table>" (for select queries)
    )
    # Find regex matches in the query
    match = re.search(pattern, query, re.IGNORECASE)
    if match:
        # Return the first non-null captured group
        return next(group for group in match.groups() if group is not None)
    else:
        return ""


# Extract the WHERE clause from DELETE query
def get_where_clause(query):
    pattern = r"where\s+(.+)"
    match = re.search(pattern, query, re.IGNORECASE)
    if match:
        return match.group(1)
    else:
        return ""


# Compare before and after states of a table to determine new rows that were added
def get_new_rows(pre, post):
    pre_set = set(tuple(row.items()) for row in pre)
    post_set = set(tuple(row.items()) for row in post)
    new_rows = [dict(row) for row in (post_set - pre_set)]
    return new_rows
