from flask import request, jsonify
from database import get_db_connection
from natlang import convert_query
from utils import (
    fetch_table_list,
    fetch_db_schema,
    get_table_name,
    get_where_clause,
    get_new_rows,
    fetch_table_details,
)


# Setup routes for RESTful API endpoints
def setup_routes(app):
    # Status route to ensure connection to the database is up
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

    @app.route("/table-details/<table_name>", methods=["GET"])
    def get_table_details(table_name):
        try:
            columns, row_count, data = fetch_table_details(table_name)
            return (
                jsonify(
                    {
                        "name": table_name,
                        "columns": columns,
                        "rowCount": row_count,
                        "data": data,
                    }
                ),
                200,
            )
        except Exception as e:
            print(f"Error in route: {str(e)}")
            return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

    # Accept a natural language query and execute it on the loaded database
    @app.route("/queries", methods=["POST"])
    def create_query():
        data = request.get_json()
        natlang_query = data.get("query", "")
        if not natlang_query:
            return jsonify({"error": "No query provided"}), 400

        schema = fetch_db_schema()
        if not schema:
            return jsonify({"error": "Failed to fetch table schema"}), 500

        try:
            with get_db_connection() as connection, connection.cursor() as cursor:
                queries = convert_query(natlang_query, schema)
                print(queries)
                if not queries:
                    return (
                        jsonify(
                            {
                                "error": "Failed to generate SQL command(s) from the query"
                            }
                        ),
                        500,
                    )
                queries = [q.strip() for q in queries.split(";") if q.strip()]

                res, in_transaction = [], False
                for query in queries:
                    try:
                        if query.lower() == "begin":
                            cursor.execute(query)
                            in_transaction = True
                        elif query.lower() == "commit":
                            if in_transaction:
                                connection.commit()
                                in_transaction = False
                            else:
                                raise ValueError(
                                    "COMMIT issued without active transaction"
                                )
                        else:
                            res.append(
                                execute_query(cursor, connection, query, in_transaction)
                            )
                    except Exception as sql_error:
                        if in_transaction:
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

            return jsonify({"results": res}), 200

        except Exception as e:
            return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


# Unified function to execute various types of queries
def execute_query(cursor, connection, query, in_transaction=False):
    table_name = get_table_name(query)

    if query.lower().startswith("select"):
        cursor.execute(query)
        return {"Query": query, "Results": cursor.fetchall()}

    elif query.lower().startswith("insert"):
        cursor.execute(f"SELECT * FROM {table_name}")
        pre_insertion = cursor.fetchall()

        cursor.execute(query)
        if not in_transaction:
            connection.commit()
        rows_affected = cursor.rowcount

        cursor.execute(f"SELECT * FROM {table_name}")
        post_insertion = cursor.fetchall()

        new_rows = get_new_rows(pre_insertion, post_insertion)

        return {
            "Query": query,
            "Message": f"{rows_affected} rows affected",
            "NewRows": new_rows,
            "Action": "insert",
        }

    elif query.lower().startswith("delete"):
        table_name = get_table_name(query)
        deleted_rows = f"SELECT * FROM {table_name} WHERE {get_where_clause(query)}"
        cursor.execute(deleted_rows)
        rows_to_delete = cursor.fetchall()
        cursor.execute(query)
        if not in_transaction:
            connection.commit()
        rows_affected = cursor.rowcount
        return {
            "Query": query,
            "Message": f"{rows_affected} rows affected",
            "DeletedRows": rows_to_delete,
            "Action": "delete",
        }

    # Handle unsupported query types
    else:
        raise ValueError(f"Unsupported query type for: {query}")
