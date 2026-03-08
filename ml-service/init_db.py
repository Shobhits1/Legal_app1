from models import db
from flask import Flask
import os
from dotenv import load_dotenv

load_dotenv()

# Create minimal Flask app just for DB init
init_app = Flask(__name__)
init_app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///nyayamitra.db")
init_app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(init_app)

with init_app.app_context():
    db.create_all()
    print("SUCCESS: Database tables created!")
    print("Tables: users, refresh_tokens, activity_logs, blacklisted_tokens")
