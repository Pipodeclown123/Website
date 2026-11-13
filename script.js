
import { db, auth, authReady } from "./firebase.js";

import {
    ref,
    get,
    set,
    push,
    onValue,
    remove,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// --------------------------------
// MENU - DIRECT WERKEND
// --------------------------------

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-button");

function showPage(pageName) {
    pages.forEach(page => {
        page.classList.toggle("active", page.id === pageName);
    });

    navButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });
}

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

// --------------------------------
// FIREBASE
// --------------------------------

let uid = null;

try {
    const credential = await authReady;
    uid = credential.user.uid;

    console.log("Firebase verbonden! 💗");
} catch (error) {
    console.error("Firebase aanmelding mislukt:", error);

    alert(
        "De website werkt, maar Firebase kon niet verbinden. " +
        "Controleer je Firebase-instellingen."
    );
}

if (!uid) {
    throw new Error("Geen Firebase-gebruiker beschikbaar.");
}

const userRef = ref(db, "users/" + uid);
const messagesRef = ref(db, `users/${uid}/messages`);
const diaryRef = ref(db, `users/${uid}/diary`);

// --------------------------------
// HIERONDER KOMT DE REST VAN JE OUDE SCRIPT
// --------------------------------
