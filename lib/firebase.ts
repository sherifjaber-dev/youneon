import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase konfiguration (fra dit projekt)
const firebaseConfig = {
  apiKey: "AIzaSyB48SU_Yy-ld89I0QV6_-7Y_M85NQsbB0u",
  authDomain: "youneon.firebaseapp.com",
  projectId: "youneon",
  storageBucket: "youneon.firebasestorage.app",
  messagingSenderId: "315573893051",
  appId: "1:315573893051:web:4deec001c59e8c7887f69e",
  measurementId: "G-M0D8SDQRT6"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Eksporter de services vi skal bruge
export const db = getFirestore(app);        // Firestore database
export const auth = getAuth(app);           // Authentication (til senere)

export default app;