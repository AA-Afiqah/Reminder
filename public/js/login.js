// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA14kghbhU43aGaMzUjoP0VR1F0n4S87Mo",
  authDomain: "macro-raceway-489306-n3.firebaseapp.com",
  projectId: "macro-raceway-489306-n3",
  storageBucket: "macro-raceway-489306-n3.firebasestorage.app",
  messagingSenderId: "131130620040",
  appId: "1:131130620040:web:2480dfcc7a39433f7ac73d",
  measurementId: "G-PQPFKZ50YE"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

function login() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then(async (result) => {
      const token = await result.user.getIdToken();

      localStorage.setItem("token", token);

      alert("Login success");

      window.location.href = "/dashboard.html";
    })
    .catch((error) => {
      console.error(error);
      alert("Login failed: " + error.message);
    });
}