# app.py - Main application file
from flask import Flask
from flask_cors import CORS
from routes import setup_routes
from models import Base, engine


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Initialize the database
    Base.metadata.create_all(bind=engine)

    # Setup the API routes from routes.py
    setup_routes(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8080, debug=True)
