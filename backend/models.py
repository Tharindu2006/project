from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Hospital(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    city = db.Column(db.String(100))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))
    role = db.Column(db.String(20))  # caregiver / client
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospital.id'))

class CaregiverProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    experience = db.Column(db.Integer)
    skills = db.Column(db.String(300))
    phone = db.Column(db.String(20))

class CareRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer)
    hospital_id = db.Column(db.Integer)
    condition = db.Column(db.String(300))
    days = db.Column(db.Integer)
    status = db.Column(db.String(20), default="open")

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    caregiver_id = db.Column(db.Integer)
    request_id = db.Column(db.Integer)
    status = db.Column(db.String(20), default="pending")