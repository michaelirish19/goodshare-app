import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2sX9gjbXbmei21Dwy5Gr2uBzYSd-V1tI",

  authDomain: "supershare-613bd.firebaseapp.com",

  projectId: "supershare-613bd",

  storageBucket: "supershare-613bd.firebasestorage.app",

  messagingSenderId: "995810736847",

  appId: "1:995810736847:web:e4a126e4e9ebb2f2a9d5ba",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };