// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCAgo7oc4lxB8BBj5uxDFaklNmJtd4wjUc",
  authDomain: "mentalhealthapp-e6742.firebaseapp.com",
  projectId: "mentalhealthapp-e6742",
  storageBucket: "mentalhealthapp-e6742.firebasestorage.app",
  messagingSenderId: "990501464490",
  appId: "1:990501464490:web:8387c508b80a7c2955e3d3",
  measurementId: "G-SW7HEV39S6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 
