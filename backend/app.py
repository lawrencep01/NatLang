# app.py - Main application file
from flask import Flask
from flask_cors import CORS
from routes import setup_routes
from models import Base, engine

app = Flask(__name__)
CORS(app)

# Initialize the database
Base.metadata.create_all(bind=engine)

# Setup the API routes from routes.py
setup_routes(app)
if __name__ == "__main__":
    app.run(debug=True)
