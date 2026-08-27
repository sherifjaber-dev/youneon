import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB48SU_Yy-ld89I0QV6_-7Y_M85NQsbB0u",
  authDomain: "youneon.firebaseapp.com",
  projectId: "youneon",
  storageBucket: "youneon.firebasestorage.app",
  messagingSenderId: "315573893051",
  appId: "1:315573893051:web:4deec001c59e8c7887f69e",
  measurementId: "G-M0D8SDQRT6"
};

const app = initializeApp(firebaseConfig);

function firestoreDb() {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
}

export const db = firestoreDb();
export const auth = getAuth(app);

export default app;
