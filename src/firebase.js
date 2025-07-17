// Importing the required functions from the Firebase SDKs

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "placeholder-project.firebaseapp.com",
  projectId: "placeholder-project",
  storageBucket: "placeholder-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:placeholder",
  measurementId: "G-PLACEHOLDER"
};

// Initializing Firebase
const app = initializeApp(firebaseConfig);

// Exporting Auth so you can use it in your app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
