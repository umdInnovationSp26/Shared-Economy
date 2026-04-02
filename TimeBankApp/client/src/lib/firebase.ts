// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import firebase from "firebase/app";
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
const db = getFirestore(app);