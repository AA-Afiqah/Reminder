import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

 const firebaseConfig = {
  apiKey: "AIzaSyA14kghbhU43aGaMzUjoP0VR1F0n4S87Mo",
  authDomain: "macro-raceway-489306-n3.firebaseapp.com",
  projectId: "macro-raceway-489306-n3",
  storageBucket: "macro-raceway-489306-n3.firebasestorage.app",
  messagingSenderId: "131130620040",
  appId: "1:131130620040:web:2480dfcc7a39433f7ac73d",
  measurementId: "G-PQPFKZ50YE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);