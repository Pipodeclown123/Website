
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
    apiKey: "VUL_HIER_JE_API_KEY_IN",
    authDomain: "JOUW-PROJECT.firebaseapp.com",
    databaseURL: "https://JOUW-PROJECT-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "JOUW-PROJECT",
    storageBucket: "JOUW-PROJECT.firebasestorage.app",
    messagingSenderId: "VUL_HIER_IN",
    appId: "VUL_HIER_IN"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

// Elke bezoeker krijgt een eigen anoniem account.
export const authReady = signInAnonymously(auth);
