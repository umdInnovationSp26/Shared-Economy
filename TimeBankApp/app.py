from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore

app = Flask(__name__)
CORS(app)

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def verify_token(req):
    auth_header = req.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    id_token = auth_header.split("Bearer ")[1]

    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        print("Token error:", e)
        return None

@app.route("/")
def home():
    return "Backend running with Firebase!"

@app.route("/api/private", methods=["GET"])
def private():
    user = verify_token(request)

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({
        "message": "Authenticated!",
        "uid": user["uid"],
        "email": user.get("email", "")
    })

@app.route("/api/create-user", methods=["POST"])
def create_user():
    user = verify_token(request)

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    ref = db.collection("users").document(user["uid"])

    if not ref.get().exists:
        ref.set({
            "email": user.get("email", ""),
            "credits": 0
        })

    return jsonify({"status": "User ready"})

if __name__ == "__main__":
    app.run(debug=True)