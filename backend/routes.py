from flask import request, jsonify
from database import get_db_connection
from natlang import convert_query
from utils import fetch_table_list, fetch_table_schema, get_table_name, get_where_clause, get_new_rows


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

    # Accept a natural language query and execute it on the loaded database
    @app.route("/queries", methods=["POST"])
    def create_query():
        data = request.get_json()
        natlang_query = data.get("query", "")
        if not natlang_query:
            return jsonify({"error": "No query provided"}), 400

        schema_desc = fetch_table_schema()
        if not schema_desc:
            return jsonify({"error": "Failed to fetch table schema"}), 500

        try:
            # Generate SQL commands using OpenAI
            queries = convert_query(natlang_query, schema_desc)
            if not queries:
                return jsonify({"error": "Failed to generate SQL from the query"}), 500

            queries = queries.split(";")
            queries = [query.strip() for query in queries if query.strip()]

            results = []
            with get_db_connection() as connection:
                with connection.cursor() as cursor:
                    for query in queries:
                        try:
                            cursor.execute(query)

                            # For SELECT queries, fetch results
                            if query.lower().startswith("select"):
                                result = cursor.fetchall()
                                results.append({"Query": query, "Results": result})

                            # For INSERT, execute query and return num rows affected and the info of the new row inserted
                            elif query.lower().startswith("insert"):
                                table_name = get_table_name(query, "insert")
                                cursor.execute(f"SELECT * FROM {table_name}")
                                pre_insertion = cursor.fetchall()

                                # Execute the insert query
                                cursor.execute(query)
                                connection.commit()
                                rows_affected = cursor.rowcount

                                # Fetch data after insertion
                                cursor.execute(f"SELECT * FROM {table_name}")
                                post_insertion = cursor.fetchall()

                                # Identify newly added rows
                                new_rows = get_new_rows(pre_insertion, post_insertion)

                                results.append(
                                    {
                                        "Query": query,
                                        "Message": f"{rows_affected} rows affected",
                                        "NewRows": new_rows,
                                        "Action": "insert"
                                    }
                                )

                            # For DELETE, execute query and return num rows affected and the info of the row(s) deleted
                            elif query.lower().startswith("delete"):
                                # Fetch data before deletion
                                table_name = get_table_name(query, "delete")
                                deleted_rows_query = f"SELECT * FROM {table_name} WHERE {get_where_clause(query)}"
                                cursor.execute(deleted_rows_query)
                                rows_to_delete = cursor.fetchall()

                                # Execute the delete query
                                cursor.execute(query)
                                connection.commit()
                                rows_affected = cursor.rowcount

                                results.append(
                                    {
                                        "Query": query,
                                        "Message": f"{rows_affected} rows affected",
                                        "DeletedRows": rows_to_delete,
                                        "Action": "delete"
                                    }
                                )

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
