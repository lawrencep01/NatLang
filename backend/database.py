import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config

# Sets up a connection to a given database
def get_db_connection():
    return psycopg2.connect(Config.DATABASE_URL, cursor_factory=RealDictCursor)