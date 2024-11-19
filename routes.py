from flask import request, jsonify
from database import get_db_connection
from natlang import convert_query
from collections import defaultdict
from utils import fetch_table_list, fetch_table_schema

# Setup routes for RESTful API
def setup_routes(app):

    # Home route to ensure connection
    @app.route('/status', methods=['GET'])
    def home():
        return jsonify({"message": "Connected to PostgreSQL database"}), 200
    
    # List all tables
    @app.route('/tables', methods=['GET'])
    def get_tables():
        tables = fetch_table_list()
        if not tables:
            return jsonify({"error": "Failed to fetch table list"}), 500
        return jsonify({"tables": tables}), 200

    # Accept a natural language query and execute it
    @app.route('/queries', methods=['POST'])
    def create_query():
        data = request.get_json()
        natural_language_query = data.get('query', '')
        if not natural_language_query:
            return jsonify({"error": "No query provided"}), 400
        
        schema_description = fetch_table_schema()
        if not schema_description:
            return jsonify({"error": "Failed to fetch table schema"}), 500

        try:
            # Generate SQL commands using OpenAI
            queries = convert_query(natural_language_query, schema_description)
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
                            # For INSERT/UPDATE/DELETE, commit changes and append success messages
                            elif query.lower().startswith(("insert", "update", "delete")):
                                connection.commit()
                                rows_affected = cursor.rowcount
                                results.append({"Query": query, "Message": f"{rows_affected} rows affected"})
                        except Exception as sql_error:
                            connection.rollback()
                            return jsonify({"error": f"SQL Execution Error: {str(sql_error)}", "query": query}), 500

            return jsonify({"results": results}), 200

        except Exception as e:
            return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500
