# Care Connect (Flask + SQLite)

Simple two‑portal web app that matches people who need caregivers with caregivers, filtered by hospitals.

## Features
- Two roles: **caregivers** and **people in need (seekers)**.
- Registration/login stored in SQLite (passwords hashed).
- Caregivers pick the hospitals they can cover; seekers post requests tied to a hospital.
- Both sides can filter caregivers or requests by hospital.
- Caregivers can accept a request; the request is then marked accepted.
- Minimal single-page UI at `/` powered by fetch calls to JSON APIs.

## Run locally
```bash
python -m venv .venv
.venv/Scripts/activate            # Windows
pip install -r requirements.txt
python -m backend.app             # or: set FLASK_APP=backend.app:create_app && flask run
```
The app creates `backend/instance/database.db` on first run and seeds a few hospitals.

## Key endpoints (JSON)
- `POST /api/register` – fields: `name,email,password,role` plus `hospital_ids` for caregivers.
- `POST /api/login`, `POST /api/logout`
- `GET /api/hospitals`
- `GET /api/caregivers?hospital_id=...`
- `GET /api/care-requests?hospital_id=...`
- `POST /api/care-requests` – seekers only.
- `POST /api/care-requests/<id>/accept` – caregivers only.
- `GET /api/me`

Helper: `python view_db.py` prints a quick dump of hospitals, users, requests, and acceptances.
