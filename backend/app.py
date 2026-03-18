from flask import Flask, request, jsonify
from config import Config
from models import db, User, Hospital, CaregiverProfile, CareRequest, Application
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# ---------------- INITIALIZE DATABASE ----------------
with app.app_context():
    db.create_all()

    # Insert default hospitals only if empty
    if Hospital.query.count() == 0:
        db.session.add(Hospital(name="National Hospital Colombo", city="Colombo"))
        db.session.add(Hospital(name="Negombo General Hospital", city="Negombo"))
        db.session.add(Hospital(name="Kandy Teaching Hospital", city="Kandy"))
        db.session.commit()


# ---------------- GET HOSPITALS ----------------
@app.route("/hospitals", methods=["GET"])
def get_hospitals():
    hospitals = Hospital.query.all()
    return jsonify([{
        "id": h.id,
        "name": h.name,
        "city": h.city
    } for h in hospitals])


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    # Check if user already exists
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"msg": "Email already registered"}), 400

    hashed_password = generate_password_hash(data["password"])

    user = User(
        name=data["name"],
        email=data["email"],
        password=hashed_password,
        role=data["role"],
        hospital_id=data["hospital_id"]
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"})


# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()

    if user and check_password_hash(user.password, data["password"]):
        token = create_access_token(identity={
            "id": user.id,
            "role": user.role,
            "hospital_id": user.hospital_id
        })

        return jsonify({
            "access_token": token,
            "role": user.role
        })

    return jsonify({"msg": "Invalid credentials"}), 401


# ---------------- CREATE CARE REQUEST (CLIENT ONLY) ----------------
@app.route("/create_request", methods=["POST"])
@jwt_required()
def create_request():
    identity = get_jwt_identity()

    if identity["role"] != "client":
        return jsonify({"msg": "Only clients can create requests"}), 403

    data = request.json

    request_obj = CareRequest(
        client_id=identity["id"],
        hospital_id=data["hospital_id"],
        condition=data["condition"],
        days=data["days"],
        status="open"
    )

    db.session.add(request_obj)
    db.session.commit()

    return jsonify({"msg": "Request created successfully"})


# ---------------- VIEW REQUESTS BY HOSPITAL ----------------
@app.route("/requests/<int:hospital_id>", methods=["GET"])
@jwt_required()
def view_requests(hospital_id):
    requests = CareRequest.query.filter_by(
        hospital_id=hospital_id,
        status="open"
    ).all()

    result = []
    for r in requests:
        result.append({
            "id": r.id,
            "condition": r.condition,
            "days": r.days,
            "status": r.status
        })

    return jsonify(result)


# ---------------- ACCEPT REQUEST (CAREGIVER ONLY) ----------------
@app.route("/accept/<int:request_id>", methods=["POST"])
@jwt_required()
def accept_request(request_id):
    identity = get_jwt_identity()

    if identity["role"] != "caregiver":
        return jsonify({"msg": "Only caregivers can accept requests"}), 403

    request_obj = CareRequest.query.get(request_id)

    if not request_obj:
        return jsonify({"msg": "Request not found"}), 404

    if request_obj.status != "open":
        return jsonify({"msg": "Request already assigned"}), 400

    # Create application record
    application = Application(
        caregiver_id=identity["id"],
        request_id=request_id,
        status="accepted"
    )

    request_obj.status = "assigned"

    db.session.add(application)
    db.session.commit()

    return jsonify({"msg": "Request accepted successfully"})

@app.route("/")
def home():
    return "CareBridge Backend Running"

# ---------------- RUN APP ----------------
if __name__ == "__main__":
    app.run(debug=True)