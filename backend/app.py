try:
    # Load variables from a local .env file for dev without affecting prod containers.
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass

import os

from flask import Flask, jsonify, render_template, request, session, send_from_directory, url_for
from flask_cors import CORS
from sqlalchemy import inspect, or_, text
from werkzeug.utils import secure_filename

from . import config
from .models import Acceptance, CareRequest, Hospital, User, db


class AdminUser:
    """Lightweight admin representation that is not stored in the DB."""

    def __init__(self):
        self.id = 0
        self.name = "Administrator"
        self.email = config.ADMIN_EMAIL
        self.role = "admin"

    def to_public_dict(self):
        return {"id": self.id, "name": self.name, "role": self.role, "email": self.email}


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config)
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = config.SESSION_COOKIE_SAMESITE
    app.config["SESSION_COOKIE_SECURE"] = config.SESSION_COOKIE_SECURE

    upload_folder = os.path.join(config.BASE_DIR, "static", "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB limit

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    with app.app_context():
        db.create_all()
        ensure_schema_columns(db.engine)
        seed_hospitals()

    @app.route("/")
    def home():
        return render_template("index.html")

    @app.route("/api/register", methods=["POST"])
    def register():
        data = request.get_json(force=True)
        required = {"name", "email", "password", "role", "phone"}
        if not required.issubset(data):
            return jsonify({"error": "Missing required fields"}), 400

        if data["role"] not in {"caregiver", "seeker"}:
            return jsonify({"error": "Role must be caregiver or seeker"}), 400

        if not (data.get("phone") or "").strip():
            return jsonify({"error": "Phone number is required"}), 400

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already registered"}), 409

        user = User(
            name=data["name"],
            email=data["email"],
            role=data["role"],
            phone=data.get("phone"),
            bio=data.get("bio"),
            profile_photo_url=data.get("profile_photo_url"),
            is_approved=False,
        )
        user.set_password(data["password"])

        if user.role == "caregiver":
            if not user.profile_photo_url:
                return jsonify({"error": "Profile photo URL is required for caregivers"}), 400
            if not (data.get("phone") or "").strip():
                return jsonify({"error": "Phone number is required for caregivers"}), 400
            hospital_ids = data.get("hospital_ids", [])
            user.hospitals = Hospital.query.filter(Hospital.id.in_(hospital_ids)).all()
            if not user.hospitals:
                return jsonify({"error": "At least one hospital must be provided"}), 400

        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "Registration submitted. Await admin approval.", "user": user.to_public_dict()}), 201

    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.get_json(force=True)

        # Admin login bypasses DB users
        if data.get("email") == config.ADMIN_EMAIL and data.get("password") == config.ADMIN_PASSWORD:
            session.clear()
            session["is_admin"] = True
            return jsonify({"user": AdminUser().to_public_dict()})

        user = User.query.filter_by(email=data.get("email")).first()
        if not user or not user.check_password(data.get("password", "")):
            return jsonify({"error": "Invalid credentials"}), 401

        if not user.is_approved:
            return jsonify({"error": "Account pending admin approval."}), 403

        session["is_admin"] = False
        session["user_id"] = user.id
        return jsonify({"user": user.to_public_dict()})

    @app.route("/api/logout", methods=["POST"])
    def logout():
        session.clear()
        return jsonify({"ok": True})

    @app.route("/api/hospitals", methods=["GET"])
    def list_hospitals():
        return jsonify([h.to_dict() for h in Hospital.query.order_by(Hospital.name)])

    @app.route("/api/admin/hospitals", methods=["POST"])
    def admin_add_hospital():
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        data = request.get_json(force=True)
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Hospital name is required"}), 400

        existing = Hospital.query.filter_by(name=name).first()
        if existing:
            return jsonify({"error": "Hospital already exists"}), 409

        hospital = Hospital(name=name)
        db.session.add(hospital)
        db.session.commit()
        return jsonify(hospital.to_dict()), 201

    @app.route("/api/caregivers", methods=["GET"])
    def list_caregivers():
        hospital_id = request.args.get("hospital_id", type=int)
        query = User.query.filter_by(role="caregiver", is_approved=True)
        if hospital_id:
            query = query.join(User.hospitals).filter(Hospital.id == hospital_id)
        caregivers = query.all()
        return jsonify([c.to_public_dict() for c in caregivers])

    @app.route("/api/upload/profile-photo", methods=["POST"])
    def upload_profile_photo():
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        filename = secure_filename(file.filename or "")
        if not filename:
            return jsonify({"error": "Invalid filename"}), 400
        if not filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
            return jsonify({"error": "Only image files are allowed"}), 400
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(save_path)
        file_url = url_for("static", filename=f"uploads/{filename}", _external=False)
        return jsonify({"url": file_url})

    @app.route("/api/care-requests", methods=["GET"])
    def list_requests():
        user = current_user()
        hospital_id = request.args.get("hospital_id", type=int)
        query = CareRequest.query.order_by(CareRequest.created_at.desc())
        if hospital_id:
            query = query.filter_by(hospital_id=hospital_id)
        if isinstance(user, AdminUser):
            filtered = query
        elif user and user.role == "seeker":
            filtered = query.filter(or_(CareRequest.is_approved.is_(True), CareRequest.seeker_id == user.id))
        else:
            filtered = query.filter_by(is_approved=True)
        return jsonify([r.to_dict() for r in filtered.all()])

    @app.route("/api/care-requests", methods=["POST"])
    def create_request():
        user = current_user()
        if not user or user.role != "seeker":
            return jsonify({"error": "Login as person in need"}), 401
        if not user.is_approved:
            return jsonify({"error": "Account pending admin approval."}), 403
        data = request.get_json(force=True)
        required = {"title", "description", "hospital_id", "phone"}
        if not required.issubset(data):
            return jsonify({"error": "Missing required fields"}), 400
        hospital = Hospital.query.get(data["hospital_id"])
        if not hospital:
            return jsonify({"error": "Invalid hospital"}), 400

        care_request = CareRequest(
            title=data["title"],
            description=data["description"],
            hospital_id=hospital.id,
            seeker_id=user.id,
            phone=data["phone"],
        )
        db.session.add(care_request)
        db.session.commit()
        return jsonify(care_request.to_dict()), 201

    @app.route("/api/care-requests/<int:request_id>", methods=["PUT"])
    def update_request(request_id: int):
        user = current_user()
        if not user or user.role != "seeker":
            return jsonify({"error": "Login as person in need"}), 401
        if not user.is_approved:
            return jsonify({"error": "Account pending admin approval."}), 403

        care_request = CareRequest.query.get_or_404(request_id)
        if care_request.seeker_id != user.id:
            return jsonify({"error": "Not your request"}), 403
        if care_request.is_approved:
            return jsonify({"error": "Cannot edit after admin approval"}), 400

        data = request.get_json(force=True)
        if "title" in data:
            care_request.title = data["title"]
        if "description" in data:
            care_request.description = data["description"]
        if "phone" in data:
            care_request.phone = data["phone"]
        if "hospital_id" in data:
            hospital = Hospital.query.get(data["hospital_id"])
            if not hospital:
                return jsonify({"error": "Invalid hospital"}), 400
            care_request.hospital_id = hospital.id
        db.session.commit()
        return jsonify(care_request.to_dict())

    @app.route("/api/care-requests/<int:request_id>", methods=["DELETE"])
    def delete_request(request_id: int):
        user = current_user()
        care_request = CareRequest.query.get_or_404(request_id)

        is_owner = user and not isinstance(user, AdminUser) and user.role == "seeker" and care_request.seeker_id == user.id
        if not (is_owner or isinstance(user, AdminUser)):
            return jsonify({"error": "Not authorized"}), 403

        Acceptance.query.filter_by(request_id=request_id).delete()
        db.session.delete(care_request)
        db.session.commit()
        return jsonify({"ok": True})

    @app.route("/api/care-requests/<int:request_id>/accept", methods=["POST"])
    def accept_request(request_id: int):
        user = current_user()
        if not user or user.role != "caregiver":
            return jsonify({"error": "Login as caregiver"}), 401
        if not user.is_approved:
            return jsonify({"error": "Account pending admin approval."}), 403

        care_request = CareRequest.query.get_or_404(request_id)
        if care_request.status != "open":
            return jsonify({"error": "Request already handled"}), 400
        if not care_request.is_approved:
            return jsonify({"error": "Request not yet approved by admin"}), 403

        acceptance = Acceptance.query.filter_by(request_id=request_id, caregiver_id=user.id).first()
        if acceptance:
            return jsonify({"error": "Already accepted"}), 400

        acceptance = Acceptance(caregiver_id=user.id, request_id=request_id, status="accepted")
        care_request.status = "accepted"
        db.session.add(acceptance)
        db.session.commit()
        return jsonify(care_request.to_dict())

    @app.route("/api/admin/care-requests/<int:request_id>", methods=["DELETE"])
    def admin_delete_request(request_id: int):
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        care_request = CareRequest.query.get(request_id)
        if not care_request:
            return jsonify({"error": "Not found"}), 404

        Acceptance.query.filter_by(request_id=request_id).delete()
        db.session.delete(care_request)
        db.session.commit()
        return jsonify({"ok": True})

    @app.route("/api/admin/care-requests/pending", methods=["GET"])
    def admin_pending_requests():
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403
        pending = CareRequest.query.filter_by(is_approved=False).order_by(CareRequest.created_at.desc()).all()
        return jsonify([r.to_dict() for r in pending])

    @app.route("/api/admin/care-requests/<int:request_id>/approve", methods=["POST"])
    def admin_approve_request(request_id: int):
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        care_request = CareRequest.query.get_or_404(request_id)
        care_request.is_approved = True
        db.session.commit()
        return jsonify({"ok": True, "request": care_request.to_dict()})

    @app.route("/api/admin/caregivers/<int:caregiver_id>", methods=["DELETE"])
    def admin_delete_caregiver(caregiver_id: int):
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        caregiver = User.query.get(caregiver_id)
        if not caregiver or caregiver.role != "caregiver":
            return jsonify({"error": "Caregiver not found"}), 404

        delete_user_and_related(caregiver)
        return jsonify({"ok": True})

    @app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
    def admin_delete_user(user_id: int):
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        target = User.query.get(user_id)
        if not target:
            return jsonify({"error": "User not found"}), 404
        delete_user_and_related(target)
        return jsonify({"ok": True})

    @app.route("/api/admin/users/pending", methods=["GET"])
    def admin_pending_users():
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403
        pending = User.query.filter_by(is_approved=False).all()
        return jsonify([u.to_public_dict() for u in pending])

    @app.route("/api/admin/users/<int:user_id>/approve", methods=["POST"])
    def admin_approve_user(user_id: int):
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403
        target = User.query.get(user_id)
        if not target:
            return jsonify({"error": "User not found"}), 404
        target.is_approved = True
        db.session.commit()
        return jsonify({"ok": True, "user": target.to_public_dict()})

    @app.route("/api/care-requests/<int:request_id>/reject", methods=["POST"])
    def reject_acceptance(request_id: int):
        user = current_user()
        if not user or user.role != "seeker":
            return jsonify({"error": "Login as person in need"}), 401
        if not user.is_approved:
            return jsonify({"error": "Account pending admin approval."}), 403

        care_request = CareRequest.query.get_or_404(request_id)
        if care_request.seeker_id != user.id:
            return jsonify({"error": "Not your request"}), 403

        data = request.get_json(force=True)
        acceptance_id = data.get("acceptance_id")
        caregiver_id = data.get("caregiver_id")

        query = Acceptance.query.filter_by(request_id=request_id)
        if acceptance_id:
            query = query.filter_by(id=acceptance_id)
        if caregiver_id:
            query = query.filter_by(caregiver_id=caregiver_id)

        acceptance = query.first()
        if not acceptance:
            return jsonify({"error": "Acceptance not found"}), 404

        acceptance.status = "rejected"
        care_request.status = "open"
        db.session.commit()
        return jsonify(care_request.to_dict())

    @app.route("/api/care-requests/<int:request_id>/approve", methods=["POST"])
    def approve_acceptance(request_id: int):
        user = current_user()
        if not user or user.role != "seeker":
            return jsonify({"error": "Login as person in need"}), 401
        if not user.is_approved:
            return jsonify({"error": "Account pending admin approval."}), 403

        care_request = CareRequest.query.get_or_404(request_id)
        if care_request.seeker_id != user.id:
            return jsonify({"error": "Not your request"}), 403

        data = request.get_json(force=True)
        acceptance_id = data.get("acceptance_id")
        caregiver_id = data.get("caregiver_id")

        query = Acceptance.query.filter_by(request_id=request_id)
        if acceptance_id:
            query = query.filter_by(id=acceptance_id)
        if caregiver_id:
            query = query.filter_by(caregiver_id=caregiver_id)

        acceptance = query.first()
        if not acceptance:
            return jsonify({"error": "Acceptance not found"}), 404

        acceptance.status = "accepted"
        care_request.status = "accepted"
        db.session.commit()
        return jsonify(care_request.to_dict())

    @app.route("/api/me", methods=["GET"])
    def whoami():
        user = current_user()
        if not user:
            return jsonify({"user": None})
        return jsonify({"user": user.to_public_dict()})

    @app.route("/admin")
    def admin_portal():
        user = current_user()
        if not user or user.role != "admin":
            return render_template("index.html")
        return render_template("admin.html")

    return app


def ensure_schema_columns(engine):
    """Ensure approval and phone columns exist for legacy databases without migrations."""

    def add_boolean_column(table: str, column: str):
        inspector = inspect(engine)
        columns = {c["name"] for c in inspector.get_columns(table)}
        if column in columns:
            return
        dialect = engine.dialect.name
        definition = "BOOLEAN NOT NULL DEFAULT 0"
        if dialect == "postgresql":
            definition = definition.replace("DEFAULT 0", "DEFAULT FALSE")
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
            conn.commit()

    def add_varchar_column(table: str, column: str, length: int = 100):
        inspector = inspect(engine)
        columns = {c["name"] for c in inspector.get_columns(table)}
        if column in columns:
            return
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} VARCHAR({length})"))
            conn.commit()

    add_boolean_column("users", "is_approved")
    add_boolean_column("care_requests", "is_approved")
    add_varchar_column("care_requests", "phone", 50)


def current_user():
    if session.get("is_admin"):
        return AdminUser()
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def delete_user_and_related(user: User):
    """Delete a user and clean up dependent rows to avoid FK issues."""
    if user.role == "caregiver":
        Acceptance.query.filter_by(caregiver_id=user.id).delete()
        user.hospitals.clear()
    elif user.role == "seeker":
        # Delete acceptances tied to this seeker's care requests, then the requests.
        request_ids = [cr.id for cr in CareRequest.query.filter_by(seeker_id=user.id).all()]
        if request_ids:
            Acceptance.query.filter(Acceptance.request_id.in_(request_ids)).delete(synchronize_session=False)
            CareRequest.query.filter(CareRequest.id.in_(request_ids)).delete(synchronize_session=False)
    db.session.delete(user)
    db.session.commit()


def seed_hospitals():
    """Populate a starter list of hospitals; add any missing ones idempotently."""
    default_names = [
        "General Hospital",
        "City Medical Center",
        "St. Mary's Hospital",
        "Lakeside Clinic",
        "Hemas Thalawathugoda Hospital",
        "Nawagamuwa Base Hospital",
    ]
    existing = {h.name for h in Hospital.query.all()}
    new_rows = [Hospital(name=name) for name in default_names if name not in existing]
    if new_rows:
        db.session.add_all(new_rows)
        db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)


