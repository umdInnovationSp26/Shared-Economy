import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# test write
doc_ref = db.collection("test").document("connection")
doc_ref.set({
    "status": "working",
    "project": "TimeBankApp"
})

# test read
doc = doc_ref.get()
if doc.exists:
    print("Connected to Firestore!")
    print(doc.to_dict())
else:
    print("Document does not exist.")