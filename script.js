/* =================================
 D ISCO - CHAT SYSTEM               *
 ================================= */


/* HTML ELEMENTS */

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const newIdBtn = document.getElementById("newIdBtn");
const changeRoomBtn = document.getElementById("changeRoomBtn");
const roomName = document.getElementById("roomName");


/* =================================
 F IREBASE                          *
 ================================= */

firebase.initializeApp({
	databaseURL: "https://xhat667-default-rtdb.europe-west1.firebasedatabase.app"
});

const db = firebase.database();
let roomQuery = null; /* ==Then the 2nd thing */

/*roomQuery.on("child_added", (snap) => {
	const m = snap.val();
	addMessage(m.text, m.user, m.ts); })};*/


function joinRoom() {

	if (roomQuery) roomQuery.off();

	roomQuery = db.ref("rooms/" + roomCode + "/messages")
	.limitToLast(50);

	roomQuery.on("child_added", (snap) => {

		const m = snap.val();

		addMessage(m.text, m.user, m.ts);

	});
}


/* =================================
 C ODE GENERATORS                   *
 ================================= */

function generateCode() {

	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

	let code = "";

	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}

	return code;
}


/* =================================
 U SER ID                           *
 ================================= */

let userCode = localStorage.getItem("userCode");

if (!userCode) {
	userCode = generateCode();
	localStorage.setItem("userCode", userCode);
}


/* =================================
 R OOM ID                           *
 ================================= */

function normalizeRoom(code) {
	return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

// Priority: ?room=CODE in the link > saved room > new random room
const urlRoom = normalizeRoom(new URLSearchParams(location.search).get("room"));
let roomCode = urlRoom || localStorage.getItem("roomCode") || generateCode();

function setRoom(code, announce = true) {

	roomCode = code;

	localStorage.setItem("roomCode", roomCode);

	roomName.textContent = "-- " + roomCode + " --";

	// keep other URL parameters (like ?dev) when changing room
	const p = new URLSearchParams(location.search);
	p.set("room", roomCode);
	history.replaceState(null, "", "?" + p.toString());

	if (announce) {
		messages.innerHTML = "";   // clear the old room's messages
		addMessage("Joined room: " + roomCode, "SYSTEM");
	}

	joinRoom();
}

if (changeRoomBtn) {
	changeRoomBtn.addEventListener("click", () => {

		const entered = prompt(
			"Enter a room code (letters/numbers, 3-12 chars).\nLeave empty for a new random room:"
		);

		if (entered === null) return;   // cancelled

		const code = normalizeRoom(entered) || generateCode();

		if (code.length < 3) {
			addMessage("Room code too short.", "SYSTEM");
			return;
		}

		setRoom(code);
		input.focus();
	});
}


/* =================================
 S ETTINGS                          *
 ================================= */

let autoScroll = true;


/* =================================
 M ESSAGE CREATOR                   *
 ================================= */

function addMessage(text, user = userCode, ts = Date.now()) {

	const msg = document.createElement("div");
	msg.className = "message";

	const time = new Date(ts);
	const hh = String(time.getHours()).padStart(2, "0");
	const mm = String(time.getMinutes()).padStart(2, "0");

	const timeSpan = document.createElement("span");
	timeSpan.className = "time";
	timeSpan.textContent = hh + ":" + mm;

	const userSpan = document.createElement("span");
	userSpan.className = "user";
	userSpan.textContent = "[" + user + "]";

	const textSpan = document.createElement("span");
	textSpan.className = "text";
	textSpan.textContent = " : " + text;

	msg.appendChild(timeSpan);
	msg.appendChild(userSpan);
	msg.appendChild(textSpan);

	messages.appendChild(msg);

	if (autoScroll) {
		messages.scrollTop = messages.scrollHeight;
	}
}


/* =================================
 A UTO SCROLL                       *
 ================================= */

messages.addEventListener("scroll", () => {

	const distance =
	messages.scrollHeight -
	messages.scrollTop -
	messages.clientHeight;

	autoScroll = distance < 50;
});


/* =================================
 D ISCO TOKEN SYSTEM                *
 ================================= */

const DAILY_TOKENS = 20;      // what a normal user gets per day
const MESSAGE_COST = 1;       // tokens spent per message
const TOKENS = 20;			//Starting balance
// TEST_TOKENS: 500 is a dev-only balance, 25x the normal daily allowance.
// It lets me spam-test sending and the "Insufficient tokens" path
// without running dry. It must never reach customers.
// const TEST_TOKENS = 500;

// Dev mode: on localhost, or on any link that has ?dev in the URL
// (remove the params.has("dev") line before customers use the site)
const params = new URLSearchParams(location.search);
const DEV_MODE =
location.hostname === "localhost" ||
location.hostname === "127.0.0.1" ||
params.has("dev");

let tokens;

if (DEV_MODE) {
	tokens = TEST_TOKENS;
} else {
	const saved = localStorage.getItem("tokens");
	tokens = saved === null ? DAILY_TOKENS : Number(saved);
}

if (!Number.isFinite(tokens) || tokens < 0) {
	tokens = DAILY_TOKENS;
}

localStorage.setItem("tokens", tokens);

// Display balance
function updateTokenDisplay() {
	const display = document.getElementById("tokenBalance");

	if (display) {
		display.textContent = tokens;
	}
}

// Charge for message
function payForMessage() {

	if (tokens < MESSAGE_COST) {
		addMessage("Insufficient tokens.", "SYSTEM");
		return false;
	}

	tokens -= MESSAGE_COST;

	localStorage.setItem("tokens", tokens);

	updateTokenDisplay();

	return true;
}

// Send message (goes to the database; the listener shows it)
function sendMessage() {

	const text = input.value.trim();

	if (!text) return;

	// commands are free and never go to the database
	if (text === "/top") {
		showTop();
		input.value = "";
		return;
	}

	if (text.startsWith("/join ")) {
		const code = normalizeRoom(text.slice(6));
		if (code.length >= 3) setRoom(code);
		else addMessage("Room code too short.", "SYSTEM");
		input.value = "";
		return;
	}

	// check the balance, but only charge after the write succeeds
	if (tokens < MESSAGE_COST) {
		addMessage("Insufficient tokens.", "SYSTEM");
		return;
	}

	const room = roomCode;   // remember the room in case it changes mid-send

	const messageRef = db.ref("rooms/" + room + "/messages").push();

	messageRef.set({

		user: userCode,
		text: text.slice(0, 300),
		ts: firebase.database.ServerValue.TIMESTAMP

	}, (error) => {

		if (error) {

			addMessage("Message failed: " + error.message, "SYSTEM");

		} else {

			tokens -= MESSAGE_COST;
			localStorage.setItem("tokens", tokens);
			updateTokenDisplay();

			input.value = "";

			// count this message for the top list
			const stats = db.ref("stats/" + room);
			stats.child("count").transaction((c) => (c || 0) + 1);
			stats.child("last").set(firebase.database.ServerValue.TIMESTAMP);
		}

		input.focus();
	});
}
/* =================================
 E NTER KEY                         *
 ================================= */

input.addEventListener("keydown", (e) => {

	if (e.key === "Enter") {
		e.preventDefault();
		sendMessage();
	}
});


/* =================================
 N EW USER ID (button hidden in HTML* for now)
 ================================= */

if (newIdBtn) {
	newIdBtn.addEventListener("click", () => {

		const oldCode = userCode;

		// Generate a different identity
		do {
			userCode = generateCode();
		} while (userCode === oldCode);

		// Save new identity
		localStorage.setItem("userCode", userCode);

		console.log("New User ID:", userCode);

		input.focus();
	});
}


/* =================================
 W ELCOME MESSAGES                  *
 ================================= */

addMessage("Welcome to Disco.", "SYSTEM");

addMessage("Room code: " + roomCode, "SYSTEM");


/* =================================
 S TART: enter the room (keep this l*ast)
 ================================= */

setRoom(roomCode, false);


/* =================================
 D EBUG                             *
 ================================= */

console.log("User ID:", userCode);
console.log("Room ID:", roomCode);
