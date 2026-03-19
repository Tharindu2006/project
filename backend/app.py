from flask import Flask, jsonify, render_template, request, session
from flask_cors import CORS

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

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    with app.app_context():
        db.create_all()
        seed_hospitals()

    @app.route("/")
    def home():
        return render_template("index.html")

    @app.route("/api/register", methods=["POST"])
    def register():
        data = request.get_json(force=True)
        required = {"name", "email", "password", "role"}
        if not required.issubset(data):
            return jsonify({"error": "Missing required fields"}), 400

        if data["role"] not in {"caregiver", "seeker"}:
            return jsonify({"error": "Role must be caregiver or seeker"}), 400

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already registered"}), 409

        user = User(
            name=data["name"],
            email=data["email"],
            role=data["role"],
            phone=data.get("phone"),
            bio=data.get("bio"),
        )
        user.set_password(data["password"])

        if user.role == "caregiver":
            hospital_ids = data.get("hospital_ids", [])
            user.hospitals = Hospital.query.filter(Hospital.id.in_(hospital_ids)).all()
            if not user.hospitals:
                return jsonify({"error": "At least one hospital must be provided"}), 400

        db.session.add(user)
        db.session.commit()

        session["user_id"] = user.id
        return jsonify({"user": user.to_public_dict()}), 201

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

    @app.route("/api/caregivers", methods=["GET"])
    def list_caregivers():
        hospital_id = request.args.get("hospital_id", type=int)
        query = User.query.filter_by(role="caregiver")
        if hospital_id:
            query = query.join(User.hospitals).filter(Hospital.id == hospital_id)
        caregivers = query.all()
        return jsonify([c.to_public_dict() for c in caregivers])

    @app.route("/api/care-requests", methods=["GET"])
    def list_requests():
        hospital_id = request.args.get("hospital_id", type=int)
        query = CareRequest.query.order_by(CareRequest.created_at.desc())
        if hospital_id:
            query = query.filter_by(hospital_id=hospital_id)
        return jsonify([r.to_dict() for r in query.all()])

    @app.route("/api/care-requests", methods=["POST"])
    def create_request():
        user = current_user()
        if not user or user.role != "seeker":
            return jsonify({"error": "Login as person in need"}), 401
        data = request.get_json(force=True)
        required = {"title", "description", "hospital_id"}
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
        )
        db.session.add(care_request)
        db.session.commit()
        return jsonify(care_request.to_dict()), 201

    @app.route("/api/care-requests/<int:request_id>/accept", methods=["POST"])
    def accept_request(request_id: int):
        user = current_user()
        if not user or user.role != "caregiver":
            return jsonify({"error": "Login as caregiver"}), 401

        care_request = CareRequest.query.get_or_404(request_id)
        if care_request.status != "open":
            return jsonify({"error": "Request already handled"}), 400

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

    @app.route("/api/admin/caregivers/<int:caregiver_id>", methods=["DELETE"])
    def admin_delete_caregiver(caregiver_id: int):
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        caregiver = User.query.get(caregiver_id)
        if not caregiver or caregiver.role != "caregiver":
            return jsonify({"error": "Caregiver not found"}), 404

        Acceptance.query.filter_by(caregiver_id=caregiver_id).delete()
        caregiver.hospitals.clear()
        db.session.delete(caregiver)
        db.session.commit()
        return jsonify({"ok": True})

    @app.route("/api/care-requests/<int:request_id>/reject", methods=["POST"])
    def reject_acceptance(request_id: int):
        user = current_user()
        if not user or user.role != "seeker":
            return jsonify({"error": "Login as person in need"}), 401

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


def current_user():
    if session.get("is_admin"):
        return AdminUser()
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


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
