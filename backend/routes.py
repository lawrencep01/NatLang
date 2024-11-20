from flask import request, jsonify
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
from database import get_db_connection
from natlang import convert_query
from utils import (
    fetch_table_list,
    fetch_table_schema,
    get_table_name,
    get_where_clause,
    get_new_rows,
)


# Setup routes for RESTful API
def setup_routes(app):
    # Home route to ensure connection is up
    @app.route("/status", methods=["GET"])
    def home():
        return jsonify({"message": "Connected to PostgreSQL database"}), 200

    # List all tables in the database for user information
    @app.route("/tables", methods=["GET"])
    def get_tables():
        tables = fetch_table_list()
        if not tables:
            return jsonify({"error": "Failed to fetch table list"}), 500
        return jsonify({"tables": tables}), 200
    
    # Fetch details of a specific table
    @app.route("/table-details/<table_name>", methods=["GET"])
    def get_table_details(table_name):
        try:
            with get_db_connection() as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Parameterized query for string value
                    columns_query = """
                    SELECT
                        column_name,
                        data_type,
                        column_default
                    FROM
                        information_schema.columns
                    WHERE
                        table_name = %s
                    """
                    cursor.execute(columns_query, (table_name,))
                    columns = cursor.fetchall()

                    # Fetch row count using sql.Identifier
                    cursor.execute(
                        sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table_name))
                    )
                    row_count = cursor.fetchone()["count"]

                    # Fetch sample data using sql.Identifier
                    cursor.execute(
                        sql.SQL("SELECT * FROM {} LIMIT 5").format(sql.Identifier(table_name))
                    )
                    sample_data = cursor.fetchall()

                    table_details = {
                        "name": table_name,
                        "columns": [
                            {
                                "name": col["column_name"],
                                "type": col["data_type"],
                            }
                            for col in columns
                        ],
                        "rowCount": row_count,
                        "sampleData": sample_data
                    }

                return jsonify(table_details), 200

        except Exception as e:
            return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

    # Accept a natural language query and execute it on the loaded database
    @app.route("/queries", methods=["POST"])
    def create_query():
        data = request.get_json()
        natlang_query = data.get("query", "")
        if not natlang_query:
            return jsonify({"error": "No query provided"}), 400

        schema = fetch_table_schema()
        if not schema:
            return jsonify({"error": "Failed to fetch table schema"}), 500

        try:
            with get_db_connection() as connection:
                with connection.cursor() as cursor:
                    queries = convert_query(natlang_query, schema)
                    if not queries:
                        return (
                            jsonify({"error": "Failed to generate SQL from the query"}),
                            500,
                        )
                    queries = queries.split(";")
                    queries = [query.strip() for query in queries if query.strip()]

                    results = []
                    for query in queries:
                        try:
                            result = execute_query(cursor, connection, query)
                            results.append(result)
                        except Exception as sql_error:
                            connection.rollback()
                            return (
                                jsonify(
                                    {
                                        "error": f"SQL Execution Error: {str(sql_error)}",
                                        "query": query,
                                    }
                                ),
                                500,
                            )

            return jsonify({"results": results}), 200

        except Exception as e:
            return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


# Unified function to execute various types of queries
def execute_query(cursor, connection, query):
    query_lower = query.lower()

    if query_lower.startswith("select"):
        # Execute the select query and return results
        cursor.execute(query)
        result = cursor.fetchall()
        return {"Query": query, "Results": result}

    elif query_lower.startswith("insert"):
        # Execute the insert query and return results
        table_name = get_table_name(query)

        # Fetch rows before insertion
        cursor.execute(f"SELECT * FROM {table_name}")
        pre_insertion = cursor.fetchall()

        # Execute insert query
        cursor.execute(query)
        connection.commit()
        rows_affected = cursor.rowcount

        # Fetch rows after insertion
        cursor.execute(f"SELECT * FROM {table_name}")
        post_insertion = cursor.fetchall()

        # Identify newly inserted rows
        new_rows = get_new_rows(pre_insertion, post_insertion)

        return {
            "Query": query,
            "Message": f"{rows_affected} rows affected",
            "NewRows": new_rows,
            "Action": "insert",
        }

    elif query_lower.startswith("delete"):
        # Execute the delete query and return results
        table_name = get_table_name(query)
        deleted_rows_query = (
            f"SELECT * FROM {table_name} WHERE {get_where_clause(query)}"
        )

        # Fetch rows before deletion
        cursor.execute(deleted_rows_query)
        rows_to_delete = cursor.fetchall()

        # Execute delete query
        cursor.execute(query)
        connection.commit()
        rows_affected = cursor.rowcount

        return {
            "Query": query,
            "Message": f"{rows_affected} rows affected",
            "DeletedRows": rows_to_delete,
            "Action": "delete",
        }

    else:
        # Handle unsupported query types
        raise ValueError(f"Unsupported query type for: {query}")
