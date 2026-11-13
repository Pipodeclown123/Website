
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// VERVANG DIT DOOR JE EIGEN FIREBASE CONFIGURATIE
const firebaseConfig = {
    apiKey: "AIzaSyAAq7fjLRJkFy3T6DGdI__ykWpxleESR9M",
    authDomain: "website-a3e4c.firebaseapp.com",
    databaseURL: "https://website-a3e4c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "website-a3e4c",
    storageBucket: "website-a3e4c.firebasestorage.app",
    messagingSenderId: "723433682510",
    appId: "1:723433682510:web:f6820e781ee2efbb8d351f"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

// Elke bezoeker krijgt een eigen anoniem account.
export const authReady = signInAnonymously(auth);
