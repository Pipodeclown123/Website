
import { db, authReady } from "./firebase.js";

import {
    ref,
    get,
    set,
    push,
    onValue,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Wacht tot Firebase is ingelogd.
await authReady;

const user = (await import(
    "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"
)).getAuth().currentUser;

const uid = user.uid;
const userRef = ref(db, "users/" + uid);

const messagesRef = ref(db, `users/${uid}/messages`);
const diaryRef = ref(db, `users/${uid}/diary`);

// HTML elementen
const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-button");

// Gegevens van je bestie
let bestie = {
    name: "Luna",
    type: "girl",
    avatar: "🐰"
};

// --------------------------------
// MENU
// --------------------------------

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
// BESTIE WEERGEVEN
// --------------------------------

function updateBestie() {
    document.querySelector("#home-name").textContent = bestie.name;
    document.querySelector("#room-name").textContent = bestie.name;

    document.querySelector("#home-avatar").textContent = bestie.avatar;
    document.querySelector("#room-avatar").textContent = bestie.avatar;

    document.querySelector("#home-description").textContent =
        bestie.type === "girl"
        ? "Jouw nieuwe beste vriendin! 🎀"
        : "Jouw nieuwe beste vriend! 💙";

    document.querySelector("#bestie-name").value = bestie.name;
    document.querySelector("#bestie-type").value = bestie.type;
    document.querySelector("#bestie-avatar").value = bestie.avatar;
}

// --------------------------------
// GEGEVENS LADEN
// --------------------------------

const snapshot = await get(userRef);

if (snapshot.exists()) {
    const data = snapshot.val();

    if (data.bestie) {
        bestie = { ...bestie, ...data.bestie };
    }
} else {
    await set(ref(db, `users/${uid}/bestie`), bestie);
}

updateBestie();

// --------------------------------
// BESTIE INSTELLINGEN
// --------------------------------

document.querySelector("#settings-form")
.addEventListener("submit", async (event) => {
    event.preventDefault();

    bestie = {
        name: document.querySelector("#bestie-name").value.trim(),
        type: document.querySelector("#bestie-type").value,
        avatar: document.querySelector("#bestie-avatar").value
    };

    if (!bestie.name) return;

    await set(ref(db, `users/${uid}/bestie`), bestie);

    updateBestie();

    alert("Je bestie is opgeslagen! 💗");
});

// --------------------------------
// CHAT REACTIES
// --------------------------------

const reactions = [
    {
        words: ["hoi", "hallo", "hey", "heyy", "hiiii"],
        replies: [
            "Hiiii! 💗 Hoe gaat het?",
            "Hééé! Wat gezellig dat je er bent!",
            "Hiiii bestieee! 🎀"
        ]
    },
    {
        words: ["goed", "prima", "leuk"],
        replies: [
            "Jaaa wat fijn!! 💕",
            "Dat is superleuk om te horen!",
            "Oeeee vertel eens meer!"
        ]
    },
    {
        words: ["slecht", "verdrietig", "rot"],
        replies: [
            "Ah wat jammer! Wil je erover vertellen? 💗",
            "Ik kan naar je luisteren.",
            "Wat vervelend! Zullen we even gezellig kletsen?"
        ]
    },
    {
        words: ["verveel", "saai"],
        replies: [
            "Oeeee zullen we een spelletje doen? 🎲",
            "Zullen we een leuke challenge bedenken?",
            "Ik heb zin in iets gezelligs! 💕"
        ]
    },
    {
        words: ["spelletje", "spelen"],
        replies: [
            "JAAAA! Zullen we een raadspelletje doen?",
            "Leuk!! Ik ben klaar voor een spelletje!",
            "Okee! Kies jij maar wat!"
        ]
    },
    {
        words: ["bedankt", "dankjewel"],
        replies: [
            "Geen probleem bestie! 💗",
            "Altijd!!",
            "Graag gedaan! 🎀"
        ]
    },
    {
        words: ["doei", "dag"],
        replies: [
            "Doeiiii! Tot snel! 💕",
            "Dag bestie! Ik vond het gezellig!",
            "Tot de volgende keer!!"
        ]
    }
];

function getReply(message) {
    const lowerMessage = message.toLowerCase();

    for (const group of reactions) {
        if (group.words.some(word => lowerMessage.includes(word))) {
            const index = Math.floor(
                Math.random() * group.replies.length
            );

            return group.replies[index];
        }
    }

    const defaultReplies = [
        "Oeeee vertel verder! 💗",
        "Echt waar?! Vertel eens!",
        "Wat leuk dat je dat vertelt!",
        "Hahaha! En wat gebeurde er toen?",
        "Ik luister bestieee! 🎀",
        "Wat vind jij daar zelf van?"
    ];

    return defaultReplies[
        Math.floor(Math.random() * defaultReplies.length)
    ];
}

// --------------------------------
// BERICHTEN WEERGEVEN
// --------------------------------

const messagesElement = document.querySelector("#messages");

function addMessage(text, sender) {
    const message = document.createElement("p");

    message.className = sender === "bestie"
        ? "message bestie-message"
        : "message user-message";

    message.textContent = text;

    messagesElement.appendChild(message);
    messagesElement.scrollTop = messagesElement.scrollHeight;
}

// Berichten live ophalen uit Firebase
onValue(messagesRef, (snapshot) => {
    messagesElement.replaceChildren();

    if (!snapshot.exists()) {
        addMessage("Hiiii! 💗 Wat leuk dat je er bent!", "bestie");
        return;
    }

    const messages = Object.values(snapshot.val());

    messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    messages.forEach(message => {
        addMessage(message.text, message.sender);
    });
});

// --------------------------------
// CHAT VERSTUREN
// --------------------------------

document.querySelector("#chat-form")
.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = document.querySelector("#chat-input");
    const message = input.value.trim();

    if (!message) return;

    input.value = "";

    await push(messagesRef, {
        text: message,
        sender: "user",
        createdAt: Date.now()
    });

    const reply = getReply(message);

    await push(messagesRef, {
        text: reply,
        sender: "bestie",
        createdAt: Date.now() + 1
    });
});

// --------------------------------
// DAGBOEK
// --------------------------------

const diaryEntries = document.querySelector("#diary-entries");

onValue(diaryRef, (snapshot) => {
    diaryEntries.replaceChildren();

    if (!snapshot.exists()) {
        diaryEntries.textContent = "Jullie hebben nog geen herinneringen. 💗";
        return;
    }

    const entries = Object.entries(snapshot.val()).reverse();

    entries.forEach(([id, entry]) => {
        const card = document.createElement("div");
        card.className = "diary-entry";

        const date = document.createElement("div");
        date.className = "diary-date";
        date.textContent = entry.date || "Een herinnering";

        const content = document.createElement("p");
        content.textContent = entry.text;

        const remove = document.createElement("button");
        remove.textContent = "Verwijderen 🗑️";

        remove.addEventListener("click", async () => {
            const { remove: removeValue } = await import(
                "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js"
            );

            await removeValue(ref(db, `users/${uid}/diary/${id}`));
        });

        card.append(date, content, remove);
        diaryEntries.appendChild(card);
    });
});

document.querySelector("#diary-form")
.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = document.querySelector("#diary-input");
    const text = input.value.trim();

    if (!text) return;

    await push(diaryRef, {
        text: text,
        date: new Date().toLocaleString("nl-NL"),
        createdAt: serverTimestamp()
    });

    input.value = "";

    alert("Herinnering opgeslagen! 💗");
});

console.log("My Bestie is gestart! 🎀");
