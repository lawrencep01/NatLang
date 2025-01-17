from flask import request, jsonify
from database import get_db_connection
from natlang import convert_query, analyze_query, generate_details
from collections import defaultdict
from models import DatabaseConnection, SessionLocal
import psycopg2
from psycopg2 import OperationalError
from utils import (
    fetch_table_list,
    fetch_db_schemas,
    get_table_name,
    get_where_clause,
    get_new_rows,
    fetch_table_details,
)
import uuid


# Setup routes for RESTful API endpoints
def setup_routes(app):

    # CREATE a new database connection
    @app.route("/connections", methods=["POST"])
    def create_connection():
        data = request.get_json()
        print(f"Received data: {data}")
        session = SessionLocal()
        try:
            # Check if the database exists
            try:
                connection = psycopg2.connect(
                    host=data["host"],
                    port=data["port"],
                    database=data["database"],
                    user=data["username"],
                    password=data["password"],
                )
                connection.close()
            except OperationalError:
                return (
                    jsonify({"error": "Database does not exist or cannot be reached"}),
                    400,
                )
            new_connection = DatabaseConnection(**data)
            session.add(new_connection)
            session.commit()
            return jsonify({"message": "Connection created successfully", "id": new_connection.id}), 201
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    # READ all database connections and list them
    @app.route("/connections", methods=["GET"])
    def get_connections():
        session = SessionLocal()
        try:
            connections = session.query(DatabaseConnection).all()
            connections_list = [
                {
                    "id": conn.id,
                    "name": conn.name,
                    "host": conn.host,
                    "port": conn.port,
                    "database": conn.database,
                    "username": conn.username,
                    "password": conn.password,
                }
                for conn in connections
            ]
            for conn in connections_list:
                conn.pop("_sa_instance_state", None)  # Remove the internal state
            return jsonify(connections_list), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    # Retrieve a specific database connection and UPDATE it
    @app.route("/connections/<int:id>", methods=["PUT"])
    def update_connection(id):
        data = request.get_json()
        session = SessionLocal()
        try:
            connection = (
                session.query(DatabaseConnection)
                .filter(DatabaseConnection.id == id)
                .first()
            )
            if not connection:
                return jsonify({"error": "Connection not found"}), 404
            for key, value in data.items():
                setattr(connection, key, value)
            session.commit()
            return jsonify({"message": "Connection updated successfully"}), 200
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    # DELETE a specific database connection
    @app.route("/connections/<int:id>", methods=["DELETE"])
    def delete_connection(id):
        session = SessionLocal()
        try:
            connection = (
                session.query(DatabaseConnection)
                .filter(DatabaseConnection.id == id)
                .first()
            )
            if not connection:
                return jsonify({"error": "Connection not found"}), 404
            session.delete(connection)
            session.commit()
            return jsonify({"message": "Connection deleted successfully"}), 200
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()

    @app.route("/db-name", methods=["GET"])
    def get_db_name():
        connection_id = request.args.get("connection_id")
        if not connection_id:
            return jsonify({"error": "connection_id is required"}), 400
        try:
            with get_db_connection(
                connection_id
            ) as connection, connection.cursor() as cursor:
                cursor.execute("SELECT current_database()")
                database_name = cursor.fetchone()["current_database"]
                return jsonify({"databaseName": database_name}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Retrieve the schema of the database
    @app.route("/schema", methods=["GET"])
    def get_schema():
        connection_id = request.args.get("connection_id")
        if not connection_id:
            return jsonify({"error": "connection_id is required"}), 400
        schema_info = fetch_db_schemas(connection_id)
        if not schema_info:
            return jsonify({"error": "Failed to fetch schema information"}), 500
        return jsonify({"schema": schema_info}), 200

    # Generate table names and descriptions in the database, if they are missing
    @app.route("/generate-descriptions", methods=["POST"])
    def generate_descriptions():
        connection_id = request.args.get("connection_id")
        if not connection_id:
            return jsonify({"error": "connection_id is required"}), 400
        schema = fetch_db_schemas(connection_id)
        if not schema:
            return jsonify({"error": "Failed to fetch table schema"}), 500
        try:
            with get_db_connection(
                connection_id
            ) as connection, connection.cursor() as cursor:
                # Query for tables without descriptions
                cursor.execute(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND obj_description((table_schema || '.' || table_name)::regclass, 'pg_class') IS NULL;
                """
                )
                tables_without_descriptions = cursor.fetchall()

                # Query for columns without descriptions
                cursor.execute(
                    """
                    SELECT table_name, column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND pg_catalog.col_description(format('%s.%s', table_schema, table_name)::regclass, ordinal_position) IS NULL;
                """
                )
                columns_without_descriptions = cursor.fetchall()

                # Tables and columns without descriptions
                missing_descriptions = {
                    "tables_without_description": [
                        table["table_name"] for table in tables_without_descriptions
                    ],
                    "columns_without_description": defaultdict(list),
                }

                # Fill data for columns without descriptions
                for row in columns_without_descriptions:
                    table_name = row["table_name"]
                    column_name = row["column_name"]
                    missing_descriptions["columns_without_description"][
                        table_name
                    ].append(column_name)
                missing_descriptions["columns_without_description"] = dict(
                    missing_descriptions["columns_without_description"]
                )

                commands = generate_details(missing_descriptions, schema)
                if not commands:
                    return jsonify({"error": "Failed to generate SQL commands"}), 500

                # Filter out empty commands, split into a list of commands, and execute each command
                commands = [c.strip() for c in commands.split(";") if c.strip()]
                for command in commands:
                    print(f"Executing command: {command}")  # Log the command
                    cursor.execute(command)
                connection.commit()

                return jsonify({"success": "Commands executed successfully"}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # List all tables in the database for user information
    @app.route("/tables", methods=["GET"])
    def get_tables():
        connection_id = request.args.get("connection_id")
        if not connection_id:
            return jsonify({"error": "connection_id is required"}), 400
        tables = fetch_table_list(connection_id)
        if not tables:
            return jsonify({"error": "Failed to fetch table list"}), 500
        return jsonify({"tables": tables}), 200

    # Retrieve details of a specific table in the database
    @app.route("/table-details/<table_name>", methods=["GET"])
    def get_table_details(table_name):
        connection_id = request.args.get("connection_id")
        schema_name = request.args.get(
            "schema_name", "public"
        )  # Default to 'public' schema if not provided
        if not connection_id:
            return jsonify({"error": "connection_id is required"}), 400
        try:
            columns, row_count, data, description = fetch_table_details(
                connection_id, table_name, schema_name
            )
            return (
                jsonify(
                    {
                        "name": table_name,
                        "schema": schema_name,
                        "columns": columns,
                        "rowCount": row_count,
                        "data": data,
                        "description": description,
                    }
                ),
                200,
            )
        except Exception as e:
            print(f"Error in route: {str(e)}")
            return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

    # Accept a natural language query and analyze it to return table name and description
    @app.route("/analyze", methods=["POST"])
    def analyze_natural_language():
        data = request.get_json()
        natlang_query = data.get("query", "")
        if not natlang_query:
            return jsonify({"error": "No query provided"}), 400
        connection_id = request.args.get("connection_id")
        if not connection_id:
            return jsonify({"error": "connection_id is required"}), 400
        schema = fetch_db_schemas(connection_id)
        if not schema:
            return jsonify({"error": "Failed to fetch table schema"}), 500

        try:
            response = analyze_query(natlang_query, schema)
            table_name, table_description = response.split("|")
            return jsonify({"name": table_name, "description": table_description}), 200
        except ValueError:
            return jsonify({"error": "Invalid response format from analyze_query"}), 500
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Accept a natural language query and execute it on the loaded database
    @app.route("/queries", methods=["POST"])
    def create_query():
        data = request.get_json()
        natlang_query = data.get("query", "")
        if not natlang_query:
            return jsonify({"error": "No query provided"}), 400
        connection_id = request.args.get("connection_id")
        if not connection_id:
            return jsonify({"error": "connection_id is required"}), 400
        schema = fetch_db_schemas(connection_id)
        if not schema:
            return jsonify({"error": "Failed to fetch table schema"}), 500

        try:
            with get_db_connection(
                connection_id
            ) as connection, connection.cursor() as cursor:
                queries = convert_query(natlang_query, schema)
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
                            query_result = execute_query(
                                cursor, connection, query, in_transaction
                            )
                            query_result["id"] = str(uuid.uuid4())
                            res.append(query_result)
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
