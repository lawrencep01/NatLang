import psycopg2
from psycopg2.extras import RealDictCursor
from models import SessionLocal, DatabaseConnection


# Get a database connection using the connection ID
def get_db_connection(connection_id):
    # New databasae connection
    session = SessionLocal()
    try:
        # Query the DatabaseConnection table to get the connection details
        connection = (
            session.query(DatabaseConnection)
            .filter(DatabaseConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise Exception("Connection not found")

        # Create the connection string using the retrieved connection details
        conn_str = f"postgresql://{connection.username}:{connection.password}@{connection.host}:{connection.port}/{connection.database}"

        # Establish and return the PostgreSQL connection using psycopg2
        return psycopg2.connect(conn_str, cursor_factory=RealDictCursor)
    finally:
        # Close the session to free up resources
        session.close()
