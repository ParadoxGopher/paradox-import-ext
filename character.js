waitforLoad().then(() => {
	let header = document.querySelector(".ct-character-header-desktop__group--share")
	let name = document.querySelector(".ddbc-character-name").innerText.trim()
	let requestId = name

	browser.runtime.sendMessage(JSON.stringify({ type: "request", payload: { type: "actor-request", payload: name, requestId: name } }))

	browser.runtime.onMessage.addListener((req, s, respond) => {
		console.log(req)
		if (req.type !== "actor-response" || req.requestId !== requestId) return
		let text = req.payload ? "update" : "import"
		if (!document.getElementById('paradox_import_start')) {
			let item = document.createElement("div")
			let button = document.createElement("button")
			let textNode = document.createTextNode(text)
			button.appendChild(textNode)
			button.id = "paradox_import_start"
			button.classList.add("ct-character-header-desktop__button")
			item.classList.add("ct-character-header-desktop__group")
			item.appendChild(button)
			header.prepend(item)
			header.parentNode.insertBefore(item, header)
		}
		
		document.getElementById('paradox_import_start').onclick = async () => {
			let character = {
				name: '',
				data: {
					abilities: {
						cha: { value: 10, proficient: 0 },
						con: { value: 10, proficient: 0 },
						dex: { value: 10, proficient: 0 },
						int: { value: 10, proficient: 0 },
						str: { value: 10, proficient: 0 },
						wis: { value: 10, proficient: 0 },
					},
					attributes: {
						ac: { value: 10 },
						hp: { value: 10, max: 10, formula: "1d20" },
						speed: { value: "30 ft.", special: "" },
						// spellcasting: "none",
					},
					details: {
						alignment: '',
						source: '',
						type: '',
						environment: '',
						biography: { value: "<p>hallo welt</p>" },
						spellLevel: 0,
					},
					resources: {
						lair: { value: false, initiative: null },
						legact: { value: 0, max: 0 },
						legres: { value: 0, max: 0 },
					},
					skills: {
						//acrobatic
						acr: { value: 0, ability: "dex" },
						//animal handling
						ani: { value: 0, ability: "wis" },
						//arcana
						arc: { value: 0, ability: "int" },
						//athletics
						ath: { value: 0, ability: "str" },
						//deception
						dec: { value: 0, ability: "cha" },
						//history
						his: { value: 0, ability: "int" },
						//insight
						ins: { value: 0, ability: "wis" },
						//investigation
						inv: { value: 0, ability: "int" },
						//intimidation
						itm: { value: 0, ability: "cha" },
						//medicine
						med: { value: 0, ability: "wis" },
						//nature
						nat: { value: 0, ability: "int" },
						//persuasion
						per: { value: 0, ability: "cha" },
						//perception
						prc: { value: 0, ability: "wis" },
						//performance
						prf: { value: 0, ability: "cha" },
						//religion
						rel: { value: 0, ability: "int" },
						//sleight of hand
						slt: { value: 0, ability: "dex" },
						//stealth
						ste: { value: 0, ability: "dex" },
						//survival
						sur: { value: 0, ability: "wis" },
					},
					spells: {
						pact: { value: 99 },
						spell1: { value: 99 },
						spell2: { value: 99 },
						spell3: { value: 99 },
						spell4: { value: 99 },
						spell5: { value: 99 },
						spell6: { value: 99 },
						spell7: { value: 99 },
						spell8: { value: 99 },
						spell9: { value: 99 },
					},
					traits: {
						//condition immunities
						ci: { value: [] },
						//damage immunities
						di: { value: [] },
						//damage resistance
						dr: { value: [] },
						//damage vulnerabilities
						dv: { value: [] },
	
						languages: { value: [], custom: "" },
						senses: "",
						size: "med"
					},
				},
				items: [],
				type: "actor",
				token: {
					displayBars: 40,
					width: 1,
					height: 1,
					scale: 1,
					bar1: { attribute: "attributes.hp" },
				},
			}

			//=======name=======//
			character.name = document.querySelector(".ddbc-character-name").innerText.trim()

			//=======abilities=======//
			document.querySelectorAll(".ct-quick-info__ability").forEach(ab => {
				let abr = ab.querySelector(".ddbc-ability-summary__abbr").innerText.trim()
				let sec = ab.querySelector(".ddbc-ability-summary__secondary").innerText.trim()

				character.data.abilities[abr].value = parseInt(sec)
			})

			let msg = {
				type: "actor",
				payload: character,
			}

			console.log("ready to send", msg)

			// browser.runtime.sendMessage(JSON.stringify(msg))
		}
	})
})

async function waitforLoad() {
	let header = document.querySelector(".ddbc-character-tidbits__menu-callout")
	while (!header) {
		await Sleep(1000)
		header = document.querySelector(".ddbc-character-tidbits__menu-callout")
	}
}

function Sleep(milli) {
	return new Promise(resolve => setTimeout(resolve, milli))
}