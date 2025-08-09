// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "taskzenith-4izkq",
  "appId": "1:515644240088:web:4fbd8d57862652bb80e7ad",
  "storageBucket": "taskzenith-4izkq.firebasestorage.app",
  "apiKey": "AIzaSyBwZC49UWi3DfgN00RCDrlw7OgCrv5hrgk",
  "authDomain": "taskzenith-4izkq.firebaseapp.com",
  "messagingSenderId": "515644240088"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
