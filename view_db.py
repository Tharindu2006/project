from backend.app import create_app, db
from backend.models import Acceptance, CareRequest, Hospital, User

app = create_app()

with app.app_context():
    print("Hospitals")
    for h in Hospital.query.all():
        print(h.id, h.name)

    print("\nUsers")
    for u in User.query.all():
        print(u.id, u.name, u.email, u.role, [h.name for h in u.hospitals], "hash:", u.password_hash)

    print("\nRequests")
    for r in CareRequest.query.all():
        print(r.id, r.title, r.status, r.hospital.name)

    print("\nAcceptances")
    for a in Acceptance.query.all():
        print(a.id, a.caregiver.name, "->", a.care_request.title)
