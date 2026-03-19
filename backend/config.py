import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
os.makedirs(INSTANCE_DIR, exist_ok=True)

DATABASE_PATH = os.path.join(INSTANCE_DIR, "database.db")
SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH}"
SQLALCHEMY_TRACK_MODIFICATIONS = False

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

# Relaxed defaults so sessions work when the UI is on another origin/port during local dev.
# Cookie settings: defaults favor same-origin local dev so sessions stick.
SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "False").lower() == "true"

# Admin bootstrap credentials (edit these manually as needed)
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
