// Firebase configuration and initialization
// Replace the below config with your own Firebase project credentials
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAD-RZ3w98THWH5mUA31D5rAvN8a4ryU1U",
  authDomain: "neighbors-helping-neighbors.firebaseapp.com",
  projectId: "neighbors-helping-neighbors",
  storageBucket: "neighbors-helping-neighbors.firebasestorage.app",
  messagingSenderId: "77918003040",
  appId: "1:77918003040:web:fd8ec163dc3a39bfc70805"
};

// Initialize Firebase


export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

