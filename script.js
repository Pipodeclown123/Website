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
// 4. SERIEUZERE CHATANTWOORDEN
// ======================================

// Dit is een lokale antwoordfunctie. Voor echte AI-antwoorden op
// werkelijk ieder onderwerp is later een beveiligde AI-server nodig.

const replyMemory = { lastTopic: "" };

function getReply(message) {
    const text = message.trim();
    const lower = text.toLowerCase();
    const has = (...words) => words.some(word => lower.includes(word));

    if (/^(hoi|hallo|hey|heyy|hi)\b/.test(lower)) {
        return `Hoi! 💗 Fijn dat je er bent. Hoe gaat het vandaag écht met je?`;
    }

    if (has("bedankt", "dankjewel", "thanks")) {
        return "Graag gedaan! 💗 Is er nog iets waarbij ik je kan helpen?";
    }

    if (/\b(doei|dag|tot later)\b/.test(lower)) {
        return "Doei! 💕 Bedankt voor het kletsen. Tot de volgende keer!";
    }

    if (has("verdrietig", "verdriet", "somber", "rot", "down", "huilen", "stress", "gestrest", "zorgen")) {
        return "Dat klinkt best lastig. Wil je vertellen wat er precies is gebeurd of wat je dwarszit? Ik neem je serieus en denk met je mee. 💗";
    }

    if (has("boos", "kwaad", "irritant", "ruzie", "gemeen")) {
        return "Ik hoor dat je boos bent. Wat is er gebeurd? Dan kunnen we samen rustig bekijken wat je eraan kunt doen.";
    }

    if (has("blij", "gelukkig", "geweldig", "superleuk", "geslaagd")) {
        return "Wat fijn om te horen! Wat maakte het moment zo leuk? Vertel eens! 💕";
    }

    if (has("school", "huiswerk", "toets", "leraar", "juf", "meester")) {
        return "Vertel eens wat er op school speelt. Gaat het om huiswerk, een toets, iemand uit je klas of iets anders? Ik help je graag stap voor stap.";
    }

    if (has("vriendin", "vriend", "vriendinnen", "vriendschap", "verkering", "verliefd")) {
        return "Vriendschappen en gevoelens kunnen soms best ingewikkeld zijn. Wat is er precies aan de hand?";
    }

    if (has("advies", "wat moet ik doen", "help me", "hoe kan ik")) {
        return "Ik denk graag met je mee. Kun je iets meer vertellen over de situatie en wat je zelf het liefst zou willen? Dan zoeken we samen naar een goede oplossing.";
    }

    if (has("spelletje", "spelen", "game", "challenge")) {
        return "Jaaa! 🎮 Ga naar Spelletjes in het menu. Daar kunnen we bijvoorbeeld Waarheid of durven, Dit of dat en Raad het woord spelen!";
    }

    if (has("verveel", "saai")) {
        return "Zullen we iets doen? 🎲 Open Spelletjes in het menu en kies een spel. Of vertel wat voor soort spel je leuk vindt.";
    }

    if (text.endsWith("?") || /^(wie|wat|waar|wanneer|waarom|hoe|welke|kan|mag|is|zijn|heeft|hebben)\b/.test(lower)) {
        return "Goede vraag! Ik wil je een passend antwoord geven en niet zomaar iets verzinnen. Kun je iets meer context geven, bijvoorbeeld waar het over gaat of wat je al weet?";
    }

    return "Ik wil goed begrijpen wat je bedoelt. Kun je daar iets meer over vertellen? Dan geef ik je een serieus antwoord en denk ik met je mee. 💗";
}

renderMessages();

// ======================================
// 4B. SPELLETJES
// ======================================

const gameOutput = document.querySelector("#game-output");
const gameButtons = document.querySelectorAll("[data-game]");

let activeGame = "";
let gameRound = 0;
let secretWord = "";

const gamePrompts = {
    truth: [
        "Wat is iets waar je heel trots op bent?",
        "Wat is de grappigste herinnering die je hebt?",
        "Welke plek zou je graag eens bezoeken?",
        "Wat is iets nieuws dat je graag zou willen leren?",
        "Wat waardeer je het meest in een goede vriendin of vriend?"
    ],

    dare: [
        "Praat 30 seconden alsof je een nieuwslezer bent.",
        "Verzin een reclame voor een gewone lepel.",
        "Doe een dier na en laat de ander raden welk dier het is.",
        "Zing een zelfverzonnen liedje van twee regels.",
        "Bedenk in 20 seconden drie namen voor een alien."
    ],

    would: [
        "Zou je liever kunnen vliegen of onzichtbaar worden?",
        "Zou je liever altijd zomer hebben of altijd winter?",
        "Zou je liever met dieren kunnen praten of alle talen spreken?",
        "Zou je liever een boomhut of een geheime kamer hebben?",
        "Zou je liever nooit meer hoeven afwassen of nooit meer hoeven opruimen?"
    ]
};

const wordList = [
    "regenboog",
    "pannenkoek",
    "dolfijn",
    "bibliotheek",
    "zonnebloem",
    "verrekijker",
    "chocolade"
];

function showGame(text) {
    if (gameOutput) {
        gameOutput.textContent = text;
    }
}

function startGame(game) {
    activeGame = game;
    gameRound = 0;

    if (game === "word") {
        secretWord = wordList[Math.floor(Math.random() * wordList.length)];

        showGame(
            "Raad het woord! Het woord heeft " +
            secretWord.length +
            " letters. Typ je gok in het vak hieronder."
        );

        document.querySelector("#game-answer").hidden = false;
        document.querySelector("#game-submit").hidden = false;
        return;
    }

    document.querySelector("#game-answer").hidden = true;
    document.querySelector("#game-submit").hidden = true;

    nextGamePrompt();
}

function nextGamePrompt() {
    const list = gamePrompts[activeGame];

    if (!list) return;

    const prompt = list[gameRound % list.length];
    gameRound++;

    const heading =
        activeGame === "truth"
            ? "Waarheid 💬"
            : activeGame === "dare"
                ? "Durven 🎭"
                : "Dit of dat 🤔";

    showGame(
        heading +
        "\n\n" +
        prompt +
        "\n\nDruk op ‘Volgende’ voor nog een opdracht."
    );
}

gameButtons.forEach(button => {
    button.addEventListener("click", () => {
        startGame(button.dataset.game);
    });
});

document.querySelector("#game-next")?.addEventListener("click", () => {
    if (!activeGame) {
        showGame("Kies eerst hierboven een spelletje!");
        return;
    }

    if (activeGame === "word") {
        secretWord = wordList[Math.floor(Math.random() * wordList.length)];

        showGame(
            "Nieuw woord! Het heeft " +
            secretWord.length +
            " letters. Raad maar!"
        );
    } else {
        nextGamePrompt();
    }
});

document.querySelector("#game-submit")?.addEventListener("click", () => {
    const answer = document.querySelector("#game-answer");
    const guess = answer.value.trim().toLowerCase();

    if (!guess) return;

    if (guess === secretWord) {
        showGame(
            "Jaaa, goed geraden! 🎉 Het woord was " +
            secretWord +
            ". Druk op ‘Volgende’ voor een nieuw woord."
        );

        answer.value = "";
    } else {
        showGame(
            "Nog niet goed! Tip: het woord begint met de letter ‘" +
            secretWord[0] +
            "’. Probeer nog eens."
        );
    }
});

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
