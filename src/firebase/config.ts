// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUK0LaoJCfawMDRmel4zig2ZMddrpYzLc",
  authDomain: "cms-ticket-sales-2b493.firebaseapp.com",
  projectId: "cms-ticket-sales-2b493",
  storageBucket: "cms-ticket-sales-2b493.appspot.com",
  messagingSenderId: "926230211223",
  appId: "1:926230211223:web:f4d743694ea22063c017d2",
  measurementId: "G-8PPJJ4GR99",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export const firestore = firebase.firestore();
export default firebase;
