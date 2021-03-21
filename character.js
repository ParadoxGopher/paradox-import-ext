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

waitforLoad().then(() => {
	const targetNode = document.querySelector("div.ct-sidebar__inner")
	const config = { childList: true, subtree: true }

	const onChangedSidebar = function() {
		const header = document.querySelector("div.ct-sidebar__header")
		if (!header) return

		const origin = getOrigin(document)
		if (!origin) {
			let button = document.getElementById("paradox_import_start")
			if (button) button.remove()
			return
		}
		const name = header.querySelector("div.ct-sidebar__header-primary").innerText.trim()

		const id = origin+":"+name
		console.log(id)

		browser.runtime.sendMessage(JSON.stringify({ type: "request", payload: { type: "char-request", payload: name, origin: origin, requestId: id } }))
	}

	const observer = new MutationObserver(onChangedSidebar)
	observer.observe(targetNode, config)
})

function getOrigin(node) {
	const content = node.querySelector("div.ct-sidebar__pane-content > div")
	if (!node) return

	const typeMatch = content.className.match(/ct-(?<type>\w+)-/)
	if (!typeMatch || !typeMatch.groups) return
	const type = typeMatch.groups.type
	
	switch (type) {
		case "racial":
		case "class":
			const origin = node.querySelector("div.ct-sidebar__header div.ct-sidebar__header-parent")
			if (!origin) return
			return origin.innerText
		default:
			return null
	}	
}

browser.runtime.onMessage.addListener((req, s, respond) => {
	console.log(req)
	const origin = getOrigin(document)
	if (!origin) return
	const name = document.querySelector("div.ct-sidebar__header-primary").innerText.trim()

	const id = origin+":"+name

	if (req.type !== "char-response" || req.requestId !== id) return

	const header = document.querySelector("div.ct-sidebar__pane-gap.ct-sidebar__pane-gap--top")

	if (document.getElementById("paradox_import_start")) return

	let text = req.payload ? "update" : "import"
	let button = document.createElement("button")
	let textNode = document.createTextNode(text)
 	button.appendChild(textNode)
 	button.id = "paradox_import_start"
	header.appendChild(button)
	header.style.height = "30px"

	button.onclick = parseFeat
})

function parseFeat() {
	let feat = NewFeat()
	let origin = getOrigin(document)
	feat.name = document.querySelector("div.ct-sidebar__header-primary").innerText.trim()
	feat.data.source = origin

	feat.data.description.value = document.querySelector("div.ct-sidebar__pane-content div.ddbc-html-content.ddbc-snippet__content").innerHTML

	let actionType = document.querySelector("div.ct-sidebar__pane-content div.ct-feature-snippet__action-summary")
	if (actionType) {
		let actionMatch = actionType.innerText.match(/: (?<count>\d) (?<type>\w+)/)
		if (actionMatch && actionMatch.groups) {
			feat.data.activation.cost = parseInt(actionMatch.groups.count)
			feat.data.activation.type = actionMatch.groups.type.toLowerCase()
		}
	}

	let limitedUses = document.querySelector("div.ct-sidebar__pane-content div.ct-feature-snippet__limited-use")
	if (limitedUses) {
		feat.data.uses.per = translateUseType(limitedUses.querySelector("div.ct-feature-snippet__limited-use-reset").innerText.trim())
		feat.data.uses.value = parseInt(limitedUses.querySelectorAll("div.ct-slot-manager__slot").length)
		feat.data.uses.max = parseInt(limitedUses.querySelectorAll("div.ct-slot-manager__slot").length)

		if (feat.data.activation.type == "") feat.data.activation.type = "none"
	}

	let message = {
		type: "char",
		payload: {
			origin: origin,
			item: feat
		}
	}

	console.log(feat)
	browser.runtime.sendMessage(JSON.stringify(message))
}

function NewFeat() {
	return {
		name: '',
		type: 'feat',
		data: {
			ability: '',
			actionType: '', //eg save
			activation: {
				type: '', //eg reaction
				cost: 0,
			},
			attackBonus: null,
			range: {
				value: null,
				units: '',
			},
			save: {
				ability: "",
				dc: null,
				scaling: "",
			},
			source: "",
			duration: {
				value: null,
				units: "",
			},
			target: {
				value: null,
				units: "",
				type: "",
			},
			formula: "",
			chatFlavour: '',
			consume: {
				type: "",
				target: "",
				amount: null,
			},
			critical: null,
			damage: {
				parts: [], //eg ["1d10+4", "fire"], ["1d4", "radiant"]
				versatile: "",
			},
			description: {
				chat: '', // TODO
				value: '',
			},
			recharge: {
				charged: false,
				value: null, //eg 5
			},
			uses: {
				value: 0,
				max: 0,
				per: "",
			}
		}
	}
}

// waitforLoad().then(() => {
// 	let header = document.querySelector(".ct-character-header-desktop__group--share")
// 	let name = document.querySelector(".ddbc-character-name").innerText.trim()
// 	let requestId = name

// 	browser.runtime.sendMessage(JSON.stringify({ type: "request", payload: { type: "actor-request", payload: name, requestId: name } }))

// 	browser.runtime.onMessage.addListener((req, s, respond) => {
// 		console.log(req)
// 		if (req.type !== "actor-response" || req.requestId !== requestId) return
// 		let text = req.payload ? "update" : "import"
// 		if (!document.getElementById('paradox_import_start')) {
// 			let item = document.createElement("div")
// 			let button = document.createElement("button")
// 			let textNode = document.createTextNode(text)
// 			button.appendChild(textNode)
// 			button.id = "paradox_import_start"
// 			button.classList.add("ct-character-header-desktop__button")
// 			item.classList.add("ct-character-header-desktop__group")
// 			item.appendChild(button)
// 			header.prepend(item)
// 			header.parentNode.insertBefore(item, header)
// 		}
		
// 		document.getElementById('paradox_import_start').onclick = async () => {
// 			let character = {
// 				name: '',
// 				data: {
// 					abilities: {
// 						cha: { value: 10, proficient: 0 },
// 						con: { value: 10, proficient: 0 },
// 						dex: { value: 10, proficient: 0 },
// 						int: { value: 10, proficient: 0 },
// 						str: { value: 10, proficient: 0 },
// 						wis: { value: 10, proficient: 0 },
// 					},
// 					attributes: {
// 						ac: { value: 10 },
// 						hp: { value: 10, max: 10, formula: "1d20" },
// 						speed: { value: "30 ft.", special: "" },
// 						// spellcasting: "none",
// 					},
// 					details: {
// 						alignment: '',
// 						source: '',
// 						type: '',
// 						environment: '',
// 						biography: { value: "<p>hallo welt</p>" },
// 						spellLevel: 0,
// 					},
// 					resources: {
// 						lair: { value: false, initiative: null },
// 						legact: { value: 0, max: 0 },
// 						legres: { value: 0, max: 0 },
// 					},
// 					skills: {
// 						//acrobatic
// 						acr: { value: 0, ability: "dex" },
// 						//animal handling
// 						ani: { value: 0, ability: "wis" },
// 						//arcana
// 						arc: { value: 0, ability: "int" },
// 						//athletics
// 						ath: { value: 0, ability: "str" },
// 						//deception
// 						dec: { value: 0, ability: "cha" },
// 						//history
// 						his: { value: 0, ability: "int" },
// 						//insight
// 						ins: { value: 0, ability: "wis" },
// 						//investigation
// 						inv: { value: 0, ability: "int" },
// 						//intimidation
// 						itm: { value: 0, ability: "cha" },
// 						//medicine
// 						med: { value: 0, ability: "wis" },
// 						//nature
// 						nat: { value: 0, ability: "int" },
// 						//persuasion
// 						per: { value: 0, ability: "cha" },
// 						//perception
// 						prc: { value: 0, ability: "wis" },
// 						//performance
// 						prf: { value: 0, ability: "cha" },
// 						//religion
// 						rel: { value: 0, ability: "int" },
// 						//sleight of hand
// 						slt: { value: 0, ability: "dex" },
// 						//stealth
// 						ste: { value: 0, ability: "dex" },
// 						//survival
// 						sur: { value: 0, ability: "wis" },
// 					},
// 					spells: {
// 						pact: { value: 99 },
// 						spell1: { value: 99 },
// 						spell2: { value: 99 },
// 						spell3: { value: 99 },
// 						spell4: { value: 99 },
// 						spell5: { value: 99 },
// 						spell6: { value: 99 },
// 						spell7: { value: 99 },
// 						spell8: { value: 99 },
// 						spell9: { value: 99 },
// 					},
// 					traits: {
// 						//condition immunities
// 						ci: { value: [] },
// 						//damage immunities
// 						di: { value: [] },
// 						//damage resistance
// 						dr: { value: [] },
// 						//damage vulnerabilities
// 						dv: { value: [] },
	
// 						languages: { value: [], custom: "" },
// 						senses: "",
// 						size: "med"
// 					},
// 				},
// 				items: [],
// 				type: "actor",
// 				token: {
// 					displayBars: 40,
// 					width: 1,
// 					height: 1,
// 					scale: 1,
// 					bar1: { attribute: "attributes.hp" },
// 				},
// 			}

// 			//=======name=======//
// 			character.name = document.querySelector(".ddbc-character-name").innerText.trim()

// 			//=======abilities=======//
// 			document.querySelectorAll(".ct-quick-info__ability").forEach(ab => {
// 				let abr = ab.querySelector(".ddbc-ability-summary__abbr").innerText.trim()
// 				let sec = ab.querySelector(".ddbc-ability-summary__secondary").innerText.trim()

// 				character.data.abilities[abr].value = parseInt(sec)
// 			})

// 			let msg = {
// 				type: "actor",
// 				payload: character,
// 			}

// 			console.log("ready to send", msg)

// 			// browser.runtime.sendMessage(JSON.stringify(msg))
// 		}
// 	})
// })
