
import { db, authReady } from "./firebase.js";

import {
    ref,
    get,
    set,
    push,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// ======================================
// 1. MENU - WERKT DIRECT
// ======================================

const $ = (selector) => document.querySelector(selector);

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

showPage("home");

// ======================================
// 2. BESTIE EN GEGEVENS
// ======================================

const STORAGE_KEY = "my-bestie-data";

let bestie = {
    name: "Luna",
    type: "girl",
    avatar: "🐰"
};

let messages = [];
let diaryEntries = [];

let firebaseEnabled = false;
let bestieRef = null;
let messagesRef = null;
let diaryRef = null;

function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        bestie,
        messages,
        diaryEntries
    }));
}

function loadLocal() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "{}"
        );

        if (saved.bestie) {
            bestie = { ...bestie, ...saved.bestie };
        }

        messages = saved.messages || [];
        diaryEntries = saved.diaryEntries || [];
    } catch (error) {
        console.log("Geen lokale gegevens gevonden.");
    }
}

function updateBestie() {
    $("#home-name").textContent = bestie.name;
    $("#room-name").textContent = bestie.name;

    $("#home-avatar").textContent = bestie.avatar;
    $("#room-avatar").textContent = bestie.avatar;

    $("#home-description").textContent =
        bestie.type === "girl"
            ? "Jouw nieuwe beste vriendin! 🎀"
            : "Jouw nieuwe beste vriend! 💙";

    $("#bestie-name").value = bestie.name;
    $("#bestie-type").value = bestie.type;
    $("#bestie-avatar").value = bestie.avatar;
}

loadLocal();
updateBestie();

// ======================================
// 3. CHAT WEERGEVEN
// ======================================

function renderMessages() {
    const container = $("#messages");
    container.replaceChildren();

    if (messages.length === 0) {
        addMessage("Hiiii! 💗 Wat leuk dat je er bent!", "bestie");
        return;
    }

    [...messages]
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        .forEach(message => {
            addMessage(message.text, message.sender);
        });
}

function addMessage(message, sender) {
    const element = document.createElement("p");

    element.className = sender === "bestie"
        ? "message bestie-message"
        : "message user-message";

    element.textContent = message;

    $("#messages").appendChild(element);
    $("#messages").scrollTop = $("#messages").scrollHeight;
}

// ======================================
// 4. CHAT ANTWOORDEN
// ======================================

const reactions = [
    {
        words: ["hoi", "hallo", "hey", "heyy"],
        replies: [
            "Hiiii! 💗 Hoe gaat het?",
            "Hééé! Wat gezellig!",
            "Hiiii bestieee! 🎀"
        ]
    },
    {
        words: ["goed", "prima", "leuk"],
        replies: [
            "Jaaa wat fijn!! 💕",
            "Dat is superleuk!",
            "Oeeee vertel eens meer!"
        ]
    },
    {
        words: ["slecht", "verdrietig", "rot"],
        replies: [
            "Ah wat jammer! Wil je erover vertellen? 💗",
            "Ik luister naar je!",
            "Wat vervelend!"
        ]
    },
    {
        words: ["verveel", "saai"],
        replies: [
            "Zullen we een spelletje doen? 🎲",
            "Zullen we een challenge bedenken?",
            "Ik heb zin in iets gezelligs!"
        ]
    },
    {
        words: ["spelletje", "spelen"],
        replies: [
            "JAAAA! Zullen we een raadspelletje doen?",
            "Leuk!! Ik ben klaar!",
            "Okee! Kies jij maar wat!"
        ]
    },
    {
        words: ["bedankt", "dankjewel"],
        replies: [
            "Geen probleem! 💗",
            "Altijd!!",
            "Graag gedaan! 🎀"
        ]
    },
    {
        words: ["doei", "dag"],
        replies: [
            "Doeiiii! Tot snel! 💕",
            "Tot de volgende keer!"
        ]
    },
    {
        words: ["eten", "honger"],
        replies: [
            "Oeeee wat ga je eten?",
            "Wat is je lievelingseten? 🍓"
        ]
    },
    {
        words: ["school", "huiswerk"],
        replies: [
            "Hoe was het op school?",
            "Heb je veel huiswerk?",
            "Wat was het leukste vandaag?"
        ]
    }
];

function getReply(message) {
    const lower = message.toLowerCase();

    for (const group of reactions) {
        if (group.words.some(word => lower.includes(word))) {
            return group.replies[
                Math.floor(Math.random() * group.replies.length)
            ];
        }
    }

    return "Oeeee vertel verder! 💗";
}

renderMessages();

// ======================================
// 5. DAGBOEK WEERGEVEN
// ======================================

function renderDiary() {
    const container = $("#diary-entries");
    container.replaceChildren();

    if (diaryEntries.length === 0) {
        container.textContent =
            "Jullie hebben nog geen herinneringen. 💗";
        return;
    }

    [...diaryEntries].reverse().forEach(entry => {
        const card = document.createElement("div");
        card.className = "diary-entry";

        const date = document.createElement("div");
        date.className = "diary-date";
        date.textContent = entry.date;

        const content = document.createElement("p");
        content.textContent = entry.text;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Verwijderen 🗑️";

        deleteButton.addEventListener("click", () => {
            deleteDiaryEntry(entry.id);
        });

        card.append(date, content, deleteButton);
        container.appendChild(card);
    });
}

renderDiary();

// ======================================
// 6. FIREBASE VERBINDING
// ======================================

const firebaseStartup = (async () => {
    try {
        const credential = await authReady;
        const uid = credential.user.uid;

        bestieRef = ref(db, `users/${uid}/bestie`);
        messagesRef = ref(db, `users/${uid}/messages`);
        diaryRef = ref(db, `users/${uid}/diary`);

        const bestieSnapshot = await get(bestieRef);
        const messagesSnapshot = await get(messagesRef);
        const diarySnapshot = await get(diaryRef);

        if (bestieSnapshot.exists()) {
            bestie = { ...bestie, ...bestieSnapshot.val() };
        } else {
            await set(bestieRef, bestie);
        }

        messages = messagesSnapshot.exists()
            ? Object.entries(messagesSnapshot.val()).map(
                ([id, item]) => ({ id, ...item })
            )
            : [];

        diaryEntries = diarySnapshot.exists()
            ? Object.entries(diarySnapshot.val()).map(
                ([id, item]) => ({ id, ...item })
            )
            : [];

        firebaseEnabled = true;

        updateBestie();
        renderMessages();
        renderDiary();

        onValue(messagesRef, snapshot => {
            messages = snapshot.exists()
                ? Object.entries(snapshot.val()).map(
                    ([id, item]) => ({ id, ...item })
                )
                : [];

            renderMessages();
            saveLocal();
        });

        onValue(diaryRef, snapshot => {
            diaryEntries = snapshot.exists()
                ? Object.entries(snapshot.val()).map(
                    ([id, item]) => ({ id, ...item })
                )
                : [];

            renderDiary();
            saveLocal();
        });

        console.log("Firebase verbonden! 💗");

    } catch (error) {
        firebaseEnabled = false;

        console.error("Firebase-fout:", error);

        saveLocal();
    }
})();

// ======================================
// 7. INSTELLINGEN OPSLAAN
// ======================================

$("#settings-form").addEventListener("submit", async event => {
    event.preventDefault();

    const name = $("#bestie-name").value.trim();

    if (!name) {
        alert("Vul eerst een naam in! 💗");
        return;
    }

    bestie = {
        name,
        type: $("#bestie-type").value,
        avatar: $("#bestie-avatar").value
    };

    updateBestie();
    saveLocal();

    await firebaseStartup;

    if (firebaseEnabled) {
        try {
            await set(bestieRef, bestie);
        } catch (error) {
            console.error(error);
            alert("Online opslaan is niet gelukt.");
            return;
        }
    }

    alert("Je bestie is opgeslagen! 💕");
});

// ======================================
// 8. CHATBERICHT VERSTUREN
// ======================================

$("#chat-form").addEventListener("submit", async event => {
    event.preventDefault();

    const input = $("#chat-input");
    const message = input.value.trim();

    if (!message) return;

    input.value = "";

    await firebaseStartup;

    const now = Date.now();

    const userMessage = {
        text: message,
        sender: "user",
        createdAt: now
    };

    const bestieMessage = {
        text: getReply(message),
        sender: "bestie",
        createdAt: now + 1
    };

    if (firebaseEnabled) {
        try {
            await push(messagesRef, userMessage);
            await push(messagesRef, bestieMessage);
            return;
        } catch (error) {
            console.error(error);
        }
    }

    messages.push(userMessage, bestieMessage);
    saveLocal();
    renderMessages();
});

// ======================================
// 9. DAGBOEK OPSLAAN
// ======================================

$("#diary-form").addEventListener("submit", async event => {
    event.preventDefault();

    const input = $("#diary-input");
    const text = input.value.trim();

    if (!text) return;

    await firebaseStartup;

    const entry = {
        text,
        date: new Date().toLocaleString("nl-NL"),
        createdAt: Date.now()
    };

    if (firebaseEnabled) {
        try {
            await push(diaryRef, entry);
            input.value = "";
            alert("Herinnering opgeslagen! 💗");
            return;
        } catch (error) {
            console.error(error);
        }
    }

    entry.id = "local-" + Date.now();

    diaryEntries.push(entry);
    saveLocal();
    renderDiary();

    input.value = "";
    alert("Herinnering opgeslagen op dit apparaat! 💗");
});

// ======================================
// 10. DAGBOEK VERWIJDEREN
// ======================================

async function deleteDiaryEntry(id) {
    if (!confirm("Wil je deze herinnering verwijderen?")) {
        return;
    }

    await firebaseStartup;

    if (firebaseEnabled && !String(id).startsWith("local-")) {
        try {
            const uid = (await authReady).user.uid;

            await remove(
                ref(db, `users/${uid}/diary/${id}`)
            );

            return;
        } catch (error) {
            console.error(error);
            alert("Verwijderen is niet gelukt.");
            return;
        }
    }

    diaryEntries = diaryEntries.filter(entry => entry.id !== id);

    saveLocal();
    renderDiary();
}

console.log("My Bestie is gestart! 🎀");
