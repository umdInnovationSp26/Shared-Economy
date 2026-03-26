import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate(r"C:\Users\danie\PycharmProjects\Shared-Economy\TimeBankApp\serviceAccountKey.json")
firebase_admin.initialize_app(cred)

print("Connected!")