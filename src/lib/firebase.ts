import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBwZC49UWi3DfgN00RCDrlw7OgCrv5hrgk",
  authDomain: "taskzenith-4izkq.firebaseapp.com",
  projectId: "taskzenith-4izkq",
  storageBucket: "taskzenith-4izkq.firebasestorage.app",
  messagingSenderId: "515644240088",
  appId: "1:515644240088:web:062ae931d48c1b4c80e7ad"
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

export { db };