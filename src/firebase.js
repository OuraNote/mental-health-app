// Importing the required functions from the Firebase SDKs

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration for Mental Health App
const firebaseConfig = {
  apiKey: "AIzaSyAY6QmMaIM2XC9Bik68x3n_SFJIj9-zKns",
  authDomain: "mentalhealthapp-59913.firebaseapp.com",
  projectId: "mentalhealthapp-59913",
  storageBucket: "mentalhealthapp-59913.firebasestorage.app",
  messagingSenderId: "882450634046",
  appId: "1:882450634046:web:4fe533404393539401086f",
  measurementId: "G-LDPFW3HSPM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporting Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
