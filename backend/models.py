from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


caregiver_hospitals = db.Table(
    "caregiver_hospitals",
    db.Column("caregiver_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("hospital_id", db.Integer, db.ForeignKey("hospitals.id"), primary_key=True),
)


class Hospital(db.Model):
    __tablename__ = "hospitals"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # "caregiver" or "seeker"
    phone = db.Column(db.String(50), nullable=True)
    bio = db.Column(db.Text, nullable=True)

    hospitals = db.relationship("Hospital", secondary=caregiver_hospitals, lazy="joined")
    requests = db.relationship("CareRequest", backref="seeker", lazy=True, foreign_keys="CareRequest.seeker_id")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_public_dict(self):
        base = {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "phone": self.phone,
            "bio": self.bio,
        }
        if self.role == "caregiver":
            base["hospitals"] = [h.to_dict() for h in self.hospitals]
        return base


class CareRequest(db.Model):
    __tablename__ = "care_requests"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    seeker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="open", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    hospital = db.relationship("Hospital", lazy="joined")
    acceptances = db.relationship("Acceptance", backref="care_request", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "hospital": self.hospital.to_dict() if self.hospital else None,
            "seeker": {"id": self.seeker.id, "name": self.seeker.name} if self.seeker else None,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "accepted_by": [
                {
                    "acceptance_id": a.id,
                    "status": a.status,
                    "caregiver": a.caregiver.to_public_dict(),
                }
                for a in self.acceptances
            ],
        }


class Acceptance(db.Model):
    __tablename__ = "acceptances"
    id = db.Column(db.Integer, primary_key=True)
    caregiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey("care_requests.id"), nullable=False)
    status = db.Column(db.String(20), default="accepted", nullable=False)

    caregiver = db.relationship("User", lazy="joined")
