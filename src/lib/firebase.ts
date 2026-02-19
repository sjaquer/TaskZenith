'use client';
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration is loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate that all firebase config values are present
const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfigKeys.length > 0) {
    const errorMessage = `Faltan las siguientes variables de entorno de Firebase: ${missingConfigKeys.join(', ')}. Asegúrate de crear un archivo .env en la raíz del proyecto y añadir todas las claves necesarias. Consulta el archivo README.md para más detalles.`;
    console.error(errorMessage);
    // You might want to throw an error or handle this case differently depending on your needs.
    // For this app, we'll log the error but allow it to proceed, which will likely result in Firebase errors downstream.
}


// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with explicit LOCAL persistence (IndexedDB → localStorage fallback)
// This ensures the auth session survives browser restarts when "Recordar sesión" is active.
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(firebaseApp, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
} catch {
  // initializeAuth throws if auth was already initialized (e.g. hot reload in dev)
  auth = getAuth(firebaseApp);
}

const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
