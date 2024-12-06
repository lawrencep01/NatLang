from database import get_db_connection
from collections import defaultdict
import re
from psycopg2 import sql
from datetime import date, datetime, time, timedelta
from decimal import Decimal
import uuid
import psycopg2.extras


# Fetch a list of all tables in the database along with their descriptions
def fetch_table_list(connection_id):
    try:
        with get_db_connection(connection_id) as connection:
            with connection.cursor() as cursor:
                # Query to fetch all user-defined tables and their descriptions in the database, excluding system tables
                table_query = """
                SELECT
                    t.table_schema,
                    t.table_name,
                    obj_description(c.oid) AS description
                FROM
                    information_schema.tables t
                JOIN
                    pg_class c ON c.relname = t.table_name
                WHERE
                    t.table_type = 'BASE TABLE'
                    AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
                ORDER BY
                    t.table_schema, t.table_name;
                """
                cursor.execute(table_query)
                tables = {}
                for row in cursor.fetchall():
                    schema = row["table_schema"]
                    table_info = {
                        "tableName": row["table_name"],
                        "description": row["description"],
                    }
                    if schema not in tables:
                        tables[schema] = []
                    tables[schema].append(table_info)
                return tables
    except Exception as e:
        print(f"Error fetching table list: {e}")
        return []


def fetch_table_details(connection_id, table_name, schema_name):
    try:
        with get_db_connection(connection_id) as connection:
            with connection.cursor() as cursor:
                # Fetch column details
                cursor.execute(
                    """
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = %s AND table_schema = %s
                    """,
                    (table_name, schema_name),
                )
                columns = cursor.fetchall()

                # Fetch row count
                cursor.execute(
                    sql.SQL("SELECT COUNT(*) FROM {}.{}").format(
                        sql.Identifier(schema_name), sql.Identifier(table_name)
                    )
                )
                row_count = cursor.fetchone()

                # Fetch table data
                cursor.execute(
                    sql.SQL("SELECT * FROM {}.{}").format(
                        sql.Identifier(schema_name), sql.Identifier(table_name)
                    )
                )
                data = cursor.fetchall()

                # Fetch table description
                cursor.execute(
                    """
                    SELECT obj_description(oid) AS description
                    FROM pg_class
                    WHERE relname = %s AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = %s)
                    """,
                    (table_name, schema_name),
                )
                description = cursor.fetchone()

                # Process the fetched data
                columns = [
                    {"name": col["column_name"], "type": col["data_type"]}
                    for col in columns
                ]
                row_count = row_count["count"] if row_count else 0

                # Convert non-serializable objects to strings
                def convert_value(value):
                    if isinstance(value, datetime):
                        return value.isoformat(sep=" ")
                    elif isinstance(value, date):
                        return value.isoformat()
                    elif isinstance(value, time):
                        return value.strftime("%H:%M:%S")
                    elif isinstance(value, Decimal):
                        return float(value)
                    elif isinstance(value, uuid.UUID):
                        return str(value)
                    elif isinstance(value, timedelta):
                        return str(value)
                    return value

                data = [
                    dict((k, convert_value(v)) for k, v in row.items()) for row in data
                ]
                description = description["description"] if description else ""
                return columns, row_count, data, description
    except Exception as e:
        print(f"Error fetching table details: {e}")
        return None, None, None, None


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


# Fetch schema data for all accessible schemas in the database, excluding views
def fetch_db_schemas(connection_id):
    try:
        with get_db_connection(connection_id) as connection, connection.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        ) as cursor:
            schema_query = """
                SELECT
                    cols.table_schema,
                    cols.table_name,
                    cols.column_name,
                    cols.data_type,
                    cols.is_nullable,
                    cols.column_default,
                    ARRAY_AGG(DISTINCT tc.constraint_type) AS constraint_types,
                    ARRAY_AGG(DISTINCT ccu_cc.table_schema || '.' || ccu_cc.table_name) FILTER (WHERE tc.constraint_type = 'FOREIGN KEY') AS foreign_tables,
                    ARRAY_AGG(DISTINCT ccu_cc.column_name) FILTER (WHERE tc.constraint_type = 'FOREIGN KEY') AS foreign_columns,
                    pgd.description,
                    tbl.table_type
                FROM
                    information_schema.columns AS cols
                LEFT JOIN
                    information_schema.key_column_usage AS kcu
                    ON cols.table_schema = kcu.table_schema
                    AND cols.table_name = kcu.table_name
                    AND cols.column_name = kcu.column_name
                LEFT JOIN
                    information_schema.table_constraints AS tc
                    ON tc.table_schema = kcu.table_schema
                    AND tc.table_name = kcu.table_name
                    AND tc.constraint_name = kcu.constraint_name
                LEFT JOIN
                    information_schema.referential_constraints AS rc
                    ON rc.constraint_schema = tc.constraint_schema
                    AND rc.constraint_name = tc.constraint_name
                LEFT JOIN
                    information_schema.key_column_usage AS ccu_cc
                    ON ccu_cc.constraint_schema = rc.unique_constraint_schema
                    AND ccu_cc.constraint_name = rc.unique_constraint_name
                    AND ccu_cc.ordinal_position = kcu.position_in_unique_constraint
                LEFT JOIN
                    pg_catalog.pg_statio_all_tables AS st
                    ON st.schemaname = cols.table_schema
                    AND st.relname = cols.table_name
                LEFT JOIN
                    pg_catalog.pg_description AS pgd
                    ON pgd.objoid = st.relid
                    AND pgd.objsubid = cols.ordinal_position
                LEFT JOIN
                    information_schema.tables AS tbl
                    ON cols.table_schema = tbl.table_schema
                    AND cols.table_name = tbl.table_name
                WHERE
                    cols.table_schema NOT IN ('pg_catalog', 'information_schema')
                    AND tbl.table_type = 'BASE TABLE'
                GROUP BY
                    cols.table_schema,
                    cols.table_name,
                    cols.column_name,
                    cols.data_type,
                    cols.is_nullable,
                    cols.column_default,
                    pgd.description,
                    tbl.table_type,
                    cols.ordinal_position
                ORDER BY
                    cols.table_schema, cols.table_name, cols.ordinal_position;
            """

            cursor.execute(schema_query)
            schema = defaultdict(lambda: defaultdict(dict))

            for row in cursor.fetchall():
                schema_name = row["table_schema"]
                table = row["table_name"]
                column = row["column_name"]

                if column not in schema[schema_name][table]:
                    schema[schema_name][table][column] = {
                        "name": column,
                        "type": row["data_type"],
                        "nullable": row["is_nullable"] == "YES",
                        "default": row["column_default"],
                        "primary_key": False,
                        "foreign_keys": [],
                        "description": row["description"],
                    }

                # Handle Primary Key
                constraint_types = row["constraint_types"]
                if constraint_types and "PRIMARY KEY" in constraint_types:
                    schema[schema_name][table][column]["primary_key"] = True
                    schema[schema_name][table][column][
                        "nullable"
                    ] = False  # Ensure PK is not nullable

                # Handle Foreign Keys
                foreign_tables = row["foreign_tables"]
                foreign_columns = row["foreign_columns"]

                # Convert foreign_tables and foreign_columns to lists if they are strings
                if isinstance(foreign_tables, str):
                    foreign_tables = (
                        foreign_tables.strip("{}").split(",") if foreign_tables else []
                    )
                if isinstance(foreign_columns, str):
                    foreign_columns = (
                        foreign_columns.strip("{}").split(",")
                        if foreign_columns
                        else []
                    )

                if foreign_tables and foreign_columns:
                    for foreign_table, foreign_column in zip(
                        foreign_tables, foreign_columns
                    ):
                        foreign_table = (
                            foreign_table.strip()
                            if isinstance(foreign_table, str)
                            else foreign_table
                        )
                        foreign_column = (
                            foreign_column.strip()
                            if isinstance(foreign_column, str)
                            else foreign_column
                        )
                        if foreign_table and foreign_column:
                            fk = {
                                "table": foreign_table,
                                "column": foreign_column,
                            }
                            if (
                                fk
                                not in schema[schema_name][table][column][
                                    "foreign_keys"
                                ]
                            ):
                                schema[schema_name][table][column][
                                    "foreign_keys"
                                ].append(fk)

            # Convert defaultdict to regular dict
            final_schema = {
                schema_name: {
                    table: list(columns.values()) for table, columns in tables.items()
                }
                for schema_name, tables in schema.items()
            }

            return final_schema

    except Exception as e:
        print(f"An error occurred: {e}")
        return None
