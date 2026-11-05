
		/* =================================
		DISCO - CHAT SYSTEM
		================================= */


		/* HTML ELEMENTS */

		const messages = document.getElementById("messages");
		const input = document.getElementById("messageInput");
		const newIdBtn = document.getElementById("newIdBtn");
		const roomName = document.getElementById("roomName");


		/* =================================
		CODE GENERATORS
		================================= */

		function generateCode() {

			const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

			let code = "";

			for (let i = 0; i < 6; i++) {

				code += chars[
					Math.floor(Math.random() * chars.length)
					];

				}

				return code;

				}


				/* =================================
				USER ID
				================================= */

				let userCode = localStorage.getItem("userCode");

				if (!userCode) {

					userCode = generateCode();

					localStorage.setItem("userCode", userCode);

					}


				/* =================================
				ROOM ID
				================================= */

				let roomCode = localStorage.getItem("roomCode");

				if (!roomCode) {

					roomCode = generateCode();

					localStorage.setItem("roomCode", roomCode);

					}

				roomName.textContent = "-- " + roomCode + " --";


				/* =================================
				SETTINGS
				================================= */

				let autoScroll = true;


				/* =================================
				MESSAGE CREATOR
				================================= */

				function addMessage(text, user = userCode) {

					const msg = document.createElement("div");

					msg.className = "message";

					const time = new Date();

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
					AUTO SCROLL
					================================= */

					messages.addEventListener("scroll", () => {

						const distance =
						messages.scrollHeight -
						messages.scrollTop -
						messages.clientHeight;

						autoScroll = distance < 50;

						});


		            /* DISCO TOKEN SYSTEM */

		            const DAILY_TOKENS = 20;
		            const MESSAGE_COST = 1;

		            const TEST_TOKENS = 500;  // Your test balance

		            // Load balance
		            // let tokens = Number(localStorage.getItem("tokens"));
		            let tokens = TEST_TOKENS;

		            localStorage.setItem("tokens", tokens);

		            updateTokenDisplay();
		            // Initialize balance
		            if (!Number.isFinite(tokens) || tokens < 0) {
		                tokens = DAILY_TOKENS;
		                localStorage.setItem("tokens", tokens);
		            }

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

		            // Send message
		            function sendMessage() {

		                const text = input.value.trim();

		                if (!text) return;

		                if (!payForMessage()) return;

		                addMessage(text, userCode);

		                input.value = "";
		                input.focus();
		            }

		            updateTokenDisplay();


					/* =================================
					ENTER KEY
					================================= */

					input.addEventListener("keydown", (e) => {

						if (e.key === "Enter") {

							e.preventDefault();

							sendMessage();

							}

						});


						/* =================================
						NEW USER ID
						================================= */

						newIdBtn.addEventListener("click", () => {

							const oldCode = userCode;

							// Generate a different identity
							do {

				 userCode = generateCode();

				 } while (userCode === oldCode);

							// Save new identity
							localStorage.setItem("userCode", userCode);

							// Notify chat
							// addMessage(


		            // "Identity changed: [" + userCode + "]",
						// "SYSTEM"
					//	);

							console.log("New User ID:", userCode);

							input.focus();

							});


							/* =================================
							WELCOME MESSAGES
							================================= */

							addMessage("Welcome to Disco.", "SYSTEM");

							addMessage("Room code: " + roomCode, "SYSTEM");


							/* =================================
							DEBUG
							================================= */

							console.log("User ID:", userCode);
							console.log("Room ID:", roomCode);
