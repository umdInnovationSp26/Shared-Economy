// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAD-RZ3w98THWH5mUA31D5rAvN8a4ryU1U",
  authDomain: "neighbors-helping-neighbors.firebaseapp.com",
  databaseURL: "https://neighbors-helping-neighbors-default-rtdb.firebaseio.com",
  projectId: "neighbors-helping-neighbors",
  storageBucket: "neighbors-helping-neighbors.firebasestorage.app",
  messagingSenderId: "77918003040",
  appId: "1:77918003040:web:fd8ec163dc3a39bfc70805",
  measurementId: "G-K0PV1C5JK1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Auth persistence set to session");
  })
  .catch((error) => {
    console.error("Persistence error:", error);
  });
export const db = getFirestore(app);