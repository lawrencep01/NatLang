from database import get_db_connection
from collections import defaultdict
import re
from psycopg2 import sql


# Fetch table schema data from the database to be used as input for OpenAI's API
def fetch_db_schema():
    try:
        with get_db_connection() as connection, connection.cursor() as cursor:
            # Query to fetch table schema information
            schema_query = """
                SELECT
                    cols.table_name,
                    cols.column_name,
                    cols.data_type,
                    cols.is_nullable,
                    cols.column_default,
                    tc.constraint_type,
                    kcu.column_name AS key_column,
                    ccu.table_name AS foreign_table,
                    ccu.column_name AS foreign_column
                FROM
                    information_schema.columns AS cols
                LEFT JOIN
                    information_schema.key_column_usage AS kcu
                ON
                    cols.table_name = kcu.table_name
                    AND cols.column_name = kcu.column_name
                LEFT JOIN
                    information_schema.table_constraints AS tc
                ON
                    kcu.constraint_name = tc.constraint_name
                LEFT JOIN
                    information_schema.constraint_column_usage AS ccu
                ON
                    tc.constraint_name = ccu.constraint_name
                WHERE
                    cols.table_schema = 'public'
                ORDER BY
                    cols.table_name, cols.ordinal_position;
                """

            cursor.execute(schema_query)
            schema = defaultdict(list)

            # Process and format schema data
            for row in cursor.fetchall():
                table_name = row["table_name"]
                column_info = (
                    f"  - {row['column_name']} ({row['data_type']})"
                    f" [Nullable: {row['is_nullable']}]"
                    f" [Default: {row['column_default'] or 'None'}]"
                )
                if row["constraint_type"] == "PRIMARY KEY":
                    column_info += " [Primary Key]"
                if row["constraint_type"] == "FOREIGN KEY":
                    column_info += f" [Foreign Key: {row['foreign_table']}.{row['foreign_column']}]"
                schema[table_name].append(column_info)

            # Format schema into a readable description
            schema_desc = "\nDatabase Schema:\n"
            for table, columns in schema.items():
                schema_desc += f"{table}\n"
                schema_desc += "\n".join(columns) + "\n\n"

            return schema_desc

    except Exception as e:
        print(f"Error fetching table schema: {e}")
        return None


# Fetch a list of all tables in the database
def fetch_table_list():
    try:
        with get_db_connection() as connection:
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
                return tables
    except Exception as e:
        print(f"Error fetching table list: {e}")
        return []


def fetch_table_details(table_name):
    try:
        with get_db_connection() as connection:
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
