import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAytb8YpWNaE_8-nJVhMttZThIMZSEBGS4",
  authDomain: "smart-clinic-48704.firebaseapp.com",
  projectId: "smart-clinic-48704",
  storageBucket: "smart-clinic-48704.firebasestorage.app",
  messagingSenderId: "32007731453",
  appId: "1:32007731453:web:c216412ab0299c66176694",
  measurementId: "G-RVHD9XRQD3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);