
import { db, authReady } from "./firebase.js";

import {
    ref,
    get,
    set,
    push,
    onValue,
    remove,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// =====================================
// 1. FIREBASE VERBINDING
// =====================================

let uid = null;

try {
    const credential = await authReady;
    uid = credential.user.uid;
    console.log("Firebase verbonden! 💗");
} catch (error) {
    console.error("Firebase fout:", error);
    alert("Firebase kon niet verbinden. Controleer je instellingen.");
    throw error;
}

const userRef = ref(db, `users/${uid}`);
const bestieRef = ref(db, `users/${uid}/bestie`);
const messagesRef = ref(db, `users/${uid}/messages`);
const diaryRef = ref(db, `users/${uid}/diary`);

// =====================================
// 2. MENU
// =====================================

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

// =====================================
// 3. BESTIE
// =====================================

let bestie = {
    name: "Luna",
    type: "girl",
    avatar: "🐰"
};

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

async function loadBestie() {
    const snapshot = await get(bestieRef);

    if (snapshot.exists()) {
        bestie = { ...bestie, ...snapshot.val() };
    } else {
        await set(bestieRef, bestie);
    }

    updateBestie();
}

// =====================================
// 4. BESTIE INSTELLINGEN
// =====================================

document.querySelector("#settings-form")
.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.querySelector("#bestie-name").value.trim();

    if (!name) {
        alert("Vul eerst een naam in! 💗");
        return;
    }

    bestie = {
        name: name,
        type: document.querySelector("#bestie-type").value,
        avatar: document.querySelector("#bestie-avatar").value
    };

    try {
        await set(bestieRef, bestie);
        updateBestie();
        alert("Je bestie is opgeslagen! 💕");
    } catch (error) {
        console.error(error);
        alert("Opslaan is niet gelukt.");
    }
});

// =====================================
// 5. CHAT REACTIES
// =====================================

const reactions = [
    {
        words: ["hoi", "hallo", "hey", "heyy", "hiiii"],
        replies: [
            "Hiiii! 💗 Hoe gaat het?",
            "Hééé! Wat gezellig dat je er bent!",
            "Hiiii bestieee! 🎀",
            "HOIIII! Ik heb je gemist!"
        ]
    },
    {
        words: ["goed", "prima", "leuk"],
        replies: [
            "Jaaa wat fijn!! 💕",
            "Dat is superleuk om te horen!",
            "Oeeee vertel eens meer!",
            "Wat heb je vandaag gedaan?"
        ]
    },
    {
        words: ["slecht", "verdrietig", "rot"],
        replies: [
            "Ah wat jammer! Wil je erover vertellen? 💗",
            "Ik luister naar je!",
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
    },
    {
        words: ["eten", "honger"],
        replies: [
            "Oeeee wat ga je eten?",
            "Ik ben benieuwd wat je lekker vindt! 🍓",
            "Vertel! Wat is je lievelingseten?"
        ]
    },
    {
        words: ["school", "huiswerk"],
        replies: [
            "Hoe was het op school?",
            "Heb je veel huiswerk?",
            "Wat was het leukste vandaag?"
        ]
    },
    {
        words: ["geheim", "vertellen"],
        replies: [
            "Oeeee ik luister! 💗",
            "Vertel maar, ik ben benieuwd!",
            "Wat spannend! Wat is er?"
        ]
    }
];

function getReply(message) {
    const lowerMessage = message.toLowerCase();

    for (const group of reactions) {
        if (group.words.some(word => lowerMessage.includes(word))) {
            const random = Math.floor(
                Math.random() * group.replies.length
            );

            return group.replies[random];
        }
    }

    const defaultReplies = [
        "Oeeee vertel verder! 💗",
        "Echt waar?! Vertel eens!",
        "Wat leuk dat je dat vertelt!",
        "Hahaha! En wat gebeurde er toen?",
        "Ik luister bestieee! 🎀",
        "Wat vind jij daar zelf van?",
        "Oehh interessant! Vertel meer!",
        "Hihi! En toen?"
    ];

    return defaultReplies[
        Math.floor(Math.random() * defaultReplies.length)
    ];
}

// =====================================
// 6. CHAT BERICHTEN
// =====================================

const messagesElement = document.querySelector("#messages");

function addMessage(message, sender) {
    const element = document.createElement("p");

    element.className = sender === "bestie"
        ? "message bestie-message"
        : "message user-message";

    element.textContent = message;

    messagesElement.appendChild(element);

    messagesElement.scrollTop = messagesElement.scrollHeight;
}

onValue(messagesRef, snapshot => {
    messagesElement.replaceChildren();

    if (!snapshot.exists()) {
        addMessage(
            "Hiiii! 💗 Wat leuk dat je er bent!",
            "bestie"
        );
        return;
    }

    const messages = Object.values(snapshot.val());

    messages.sort(
        (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
    );

    messages.forEach(message => {
        addMessage(message.text, message.sender);
    });
});

// =====================================
// 7. BERICHT VERSTUREN
// =====================================

document.querySelector("#chat-form")
.addEventListener("submit", async event => {
    event.preventDefault();

    const input = document.querySelector("#chat-input");
    const message = input.value.trim();

    if (!message) return;

    input.value = "";

    try {
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

    } catch (error) {
        console.error("Chat fout:", error);
        alert("Je bericht kon niet worden verstuurd.");
    }
});

// =====================================
// 8. DAGBOEK
// =====================================

const diaryEntries = document.querySelector("#diary-entries");

onValue(diaryRef, snapshot => {
    diaryEntries.replaceChildren();

    if (!snapshot.exists()) {
        diaryEntries.textContent =
            "Jullie hebben nog geen herinneringen. 💗";
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

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Verwijderen 🗑️";

        deleteButton.addEventListener("click", async () => {
            if (!confirm("Wil je deze herinnering verwijderen?")) {
                return;
            }

            try {
                await remove(ref(db, `users/${uid}/diary/${id}`));
            } catch (error) {
                console.error(error);
                alert("Verwijderen is niet gelukt.");
            }
        });

        card.append(date, content, deleteButton);
        diaryEntries.appendChild(card);
    });
});

// =====================================
// 9. HERINNERING OPSLAAN
// =====================================

document.querySelector("#diary-form")
.addEventListener("submit", async event => {
    event.preventDefault();

    const input = document.querySelector("#diary-input");
    const text = input.value.trim();

    if (!text) return;

    try {
        await push(diaryRef, {
            text: text,
            date: new Date().toLocaleString("nl-NL"),
            createdAt: serverTimestamp()
        });

        input.value = "";
        alert("Herinnering opgeslagen! 💗");

    } catch (error) {
        console.error(error);
        alert("Opslaan is niet gelukt.");
    }
});

// =====================================
// 10. WEBSITE STARTEN
// =====================================

try {
    await loadBestie();
    showPage("home");
    console.log("My Bestie is klaar! 🎀");
} catch (error) {
    console.error("Website kon niet volledig starten:", error);
    alert("Er ging iets mis bij het laden van je bestie.");
}
