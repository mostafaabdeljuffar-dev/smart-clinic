import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// 1. استيراد مكتبات App Check
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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

if (typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LfBPeosAAAAAFL6vD6-2bDDQ5vChWJagvq5o6HD'),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
