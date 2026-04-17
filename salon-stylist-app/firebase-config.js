// Firebase Configuration for Stylist App
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCo2HhVTZ0rkbhpjvxPEwx_Mo6osqMGlz0",
  authDomain: "exampleapp-17653.firebaseapp.com",
  projectId: "exampleapp-17653",
  storageBucket: "exampleapp-17653.firebasestorage.app",
  messagingSenderId: "934175824116",
  appId: "1:934175824116:web:af0f42f657005f1abe66a1",
  measurementId: "G-JHZ5YFW4Y6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;