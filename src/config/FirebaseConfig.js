// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   measurementId: "G-D8ZET4YGN8"
// };

// const firebaseConfig = {
//   apiKey: "AIzaSyBHy4gnb-gf4Hf6O7bLno1ReNo_REduGoU",
//   authDomain: "originals-website.firebaseapp.com",
//   projectId: "originals-website",
//   storageBucket: "originals-website.firebasestorage.app",
//   messagingSenderId: "368704000921",
//   appId: "1:368704000921:web:5cfca95d6ad861bd9fb908",
//   measurementId: "G-J8RYV0HCP9"
// };
const firebaseConfig = {
  apiKey: "AIzaSyDSF-p7jbwvW-SeUTx5q_J2215Ve9iOLG0",
  authDomain: "test-c5251.firebaseapp.com",
  projectId: "test-c5251",
  storageBucket: "test-c5251.firebasestorage.app",
  messagingSenderId: "865224794512",
  appId: "1:865224794512:web:6ec23d724d6907f9075315",
  measurementId: "G-D8ZET4YGN8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);