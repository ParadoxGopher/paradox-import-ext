let header = document.querySelector('.page-heading__suffix')
let name = document.querySelector('a.mon-stat-block__name-link').innerText.trim()
let requestId = name

browser.runtime.sendMessage(JSON.stringify({ type: "request", payload: { type: "monster-request", payload: name, requestId: requestId } }))

browser.runtime.onMessage.addListener((req, s, respond) => {
	console.log(req)
	if (req.type !== "monster-response" || req.requestId !== requestId) return
	let importUpdate = req.payload.actor ? "update" : "import"
	if (!document.getElementById('paradox_import_start')) {
		let button = document.createElement("button")
		let actorText = document.createTextNode("actor: "+req.payload.actor+"\n")
		let compendiumText = document.createTextNode("compendium: "+req.payload.compendium+"\n")
		let importText = document.createTextNode(importUpdate)
		button.appendChild(actorText)
		button.appendChild(compendiumText)
		button.appendChild(importText)
		button.id = "paradox_import_start"

		header.appendChild(button)
	}

	document.getElementById('paradox_import_start').onclick = async () => {
		let monster = await scrapeMonster()
		msg = {
			type: "monster",
			payload: monster,
		}

		browser.runtime.sendMessage(JSON.stringify(msg)).then(console.log, console.error)
	}
})

async function scrapeMonster() {
	let monster = {
		name: '',
		data: {
			flags: {
				betterRolls5e: {
					quickDesc: { type: "Boolean", value: false, altValue: true },
				}
			},
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
				senses: { blindsight: 0, darkvision: 0, tremorsense: 0, truesight: 0, special: "", units: "ft"},
				// spellcasting: "none",
			},
			details: {
				alignment: '',
				cr: 1,
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
				size: "med"
			},
		},
		items: [],
		type: "npc",
		token: {
			displayBars: 40,
			width: 1,
			height: 1,
			scale: 1,
			bar1: { attribute: "attributes.hp" },
		},
	}


	//================== Reference ==================//
	monster.url = window.location.href

	//================== Image ==================//
	monster.img = document.querySelector('.details-aside .image a').href

	//================== Name ==================//
	monster.name = document.querySelector('a.mon-stat-block__name-link').innerText.trim()

	//================== Meta ==================//
	let meta = document.querySelector('.mon-stat-block__meta').innerText
	let parts = meta.split(',')
	let [size, ...type] = parts[0].split(" ")
	monster.data.traits.size = translateSize(size.toLowerCase().trim())
	monster.data.details.type = type.join(" ")
	monster.data.details.alignment = parts[1].trim()

	//================== AC/HP/Speed ==================//
	let acHpSpeed = document.querySelectorAll('.mon-stat-block__attributes .mon-stat-block__attribute')
	monster.data.attributes.ac.value = parseInt(acHpSpeed[0].querySelector('.mon-stat-block__attribute-data-value').innerText.trim())
	monster.data.attributes.hp.value = parseInt(acHpSpeed[1].querySelector('.mon-stat-block__attribute-data-value').innerText.trim())
	monster.data.attributes.hp.max = monster.data.attributes.hp.value
	monster.data.attributes.hp.formula = acHpSpeed[1].querySelector('.mon-stat-block__attribute-data-extra').innerText.replace('(', '').replace(')', '').trim()
	let [speed, ...specials] = acHpSpeed[2].querySelector('.mon-stat-block__attribute-data-value').innerText.trim().split(", ")
	monster.data.attributes.speed.value = speed
	monster.data.attributes.speed.special = specials.join(";")

	//================== Attributes ==================//
	const statBlock = document.querySelector('.mon-stat-block__stat-block')
	monster.data.abilities.dex.value = parseInt(statBlock.querySelector('.ability-block__stat--dex .ability-block__score').innerText)
	monster.data.abilities.str.value = parseInt(statBlock.querySelector('.ability-block__stat--str .ability-block__score').innerText)
	monster.data.abilities.con.value = parseInt(statBlock.querySelector('.ability-block__stat--con .ability-block__score').innerText)
	monster.data.abilities.int.value = parseInt(statBlock.querySelector('.ability-block__stat--int .ability-block__score').innerText)
	monster.data.abilities.wis.value = parseInt(statBlock.querySelector('.ability-block__stat--wis .ability-block__score').innerText)
	monster.data.abilities.cha.value = parseInt(statBlock.querySelector('.ability-block__stat--cha .ability-block__score').innerText)

	//================== Proficiencies/Traits ==================//
	var titbits = document.querySelectorAll('.mon-stat-block__tidbits .mon-stat-block__tidbit')

	titbits.forEach(t => {
		if (t.querySelector('.mon-stat-block__tidbit-label').innerText.trim() === "Challenge") {
			monster.data.details.cr = parseInt(t.querySelector('.mon-stat-block__tidbit-data').innerText.split(' ')[0].trim())
		}
	})

	//================== Proficiency Modifier ==================//
	const profMod = challengeRatingToProfMod(monster.data.details.cr)
	titbits.forEach(tidbit => {
		const label = tidbit.querySelector('.mon-stat-block__tidbit-label').innerText.trim()
		const data = tidbit.querySelector('.mon-stat-block__tidbit-data')

		switch (label) {
			//================== Saving Throws ==================//
			case "Saving Throws":
				let savingMatches = data.innerText.match(/(\w){3} \+\d/g)
				if (savingMatches) {
					savingMatches.forEach(m => {
						monster.data.abilities[m.split(' ')[0].toLowerCase()].proficient = 1
					})
				}
				break
			//================== Skills ==================//
			case "Skills":
				data.innerText.replace('+', '').split(', ').forEach(s => {
					let mod = parseFloat(s.split(' ')[1])
					let skill = translateSkills(s.split(' ')[0])
					mod -= parseInt(statBlock.querySelector('.ability-block__stat--' + monster.data.skills[skill].ability + ' .ability-block__modifier').innerText.replace(/(\(|\)|\+)/g, ""))
					monster.data.skills[skill].value = mod / profMod
				})
				break
			//================== Senses ==================//
			case "Senses":
				data.innerText.trim().split(",").forEach(s => {
					let match = s.match(/ (?<range>\d+) ft\./)
					trimmed = s.trim()
					console.log(trimmed, match)
					if (trimmed.startsWith("Blindsight") && match && match.groups.range) {
						monster.data.attributes.senses.blindsight = parseInt(match.groups.range)
					} else if (trimmed.startsWith("Darkvision") && match && match.groups.range) {
						monster.data.attributes.senses.darkvision = parseInt(match.groups.range)
					} else if (trimmed.startsWith("Truesight") && match && match.groups.range) {
						monster.data.attributes.senses.truesight = parseInt(match.groups.range)
					} else if (trimmed.startsWith("Tremorsense") && match && match.groups.range) {
						monster.data.attributes.senses.tremorsense = parseInt(match.groups.range)
					} else if (!trimmed.startsWith("Passive Perception")) {
						monster.data.attributes.senses.special = trimmed
					}
				})

				break
			//================== Languages ==================//
			case "Languages":
				data.innerText.split(', ').forEach(l => {
					if (l.trim().length > 14) {
						monster.data.traits.languages.custom = l.trim()
					} else {
						monster.data.traits.languages.value.push(l.toLowerCase().trim())
					}
				})
				break
			//================== Resistances ==================//
			case "Condition Immunities":
				data.innerText.split(', ').forEach(ci => {
					monster.data.traits.ci.value.push(ci.toLowerCase())
				})
				break
			case "Damage Immunities":
				data.innerText.split(', ').forEach(di => {
					monster.data.traits.di.value.push(di.toLowerCase())
				})
				break
			case "Damage Vulnerabilities":
				data.innerText.split(', ').forEach(dv => {
					monster.data.traits.dv.value.push(dv.toLowerCase())
				})
				break
			case "Damage Resistances":
				data.innerText.split(', ').forEach(dr => {
					monster.data.traits.dr.value.push(dr.toLowerCase())
				})
				break
		}
	})

	//================== Actions / Reactions / Feats ==================//
	let descBlocks = document.querySelectorAll('.mon-stat-block__description-block')
	for (let descIndex = 0; descIndex < descBlocks.length; descIndex++) {
		let b = descBlocks[descIndex]
		var label = ''
		var heading = b.querySelector('.mon-stat-block__description-block-heading')
		if (heading) {
			label = heading.innerText
		}
		var data = b.querySelector('.mon-stat-block__description-block-content')

		let docs = data.querySelectorAll('p')
		for (let i = 0; i < docs.length; i++) {
			let p = docs[i]
			let feat = NewItem()
			if (!feat.parseActionItem(p, label)) {
				if (label !== "Legendary Actions") {
					let spells = await fetchSpells(p)

					let useMatch = p.innerText.match(/^(?<uses>\d+)\/(?<unit>\w+)/)
					if (useMatch) {
						spells.forEach(s => {
							s.data.uses.value = useMatch.groups.uses
							s.data.uses.max = useMatch.groups.uses
							s.data.uses.per = useMatch.groups.unit.toLowerCase()
							s.data.preparation.mode = "innate"
						})
					}

					let willMatch = p.innerText.match(/^At will/)
					if (willMatch) {
						spells.forEach(s => s.data.preparation.mode = "atwill")
					}

					monster.items.push(...spells)
					continue
				}
				let legactMatch = p.innerText.match(/take (up to )?((?<word>[a-zA-Z]+)|(?<number>\d+)) legendary actions/)
				if (legactMatch != null) {
					if (legactMatch.groups.word) {
						monster.data.resources.legact.value = translateNumber(legactMatch.groups.word)
						monster.data.resources.legact.max = translateNumber(legactMatch.groups.word)
					} else {
						monster.data.resources.legact.value = parseInt(legactMatch.groups.number)
						monster.data.resources.legact.max = parseInt(legactMatch.groups.number)
					}
				}
				continue
			}
			if (feat.data.attackBonus > 0) { 
				// (r|m)wak => dex || str
				if (feat.data.actionType.endsWith("wak")) {
					if (calcAbilityMod(monster.data.abilities.str.value) + profMod == feat.data.attackBonus) {
						feat.data.ability = "str"
						feat.data.attackBonus = 0
					} else if (calcAbilityMod(monster.data.abilities.dex.value) + profMod == feat.data.attackBonus) {
						feat.data.ability = "dex"
						feat.data.attackBonus = 0
					} else {
						// TODO what to do now ?
						feat.data.attackBonus = -profMod
					}
				} else {
					feat.data.attackBonus = 0
				}
			}
			monster.items.push(feat)
		}
	}

	//================== Legendary Resistance ==================//
	let desc = document.querySelector('.mon-stat-block__description-blocks')
	let legresMatch = desc.innerText.match(/Legendary Resistance \((?<legres>\d+)\//)
	if (legresMatch != null) {
		monster.data.resources.legres.value = legresMatch.groups.legres
		monster.data.resources.legres.max = legresMatch.groups.legres
	}

	//================== Spellcasting ==================//
	let spellFeat = monster.items.find(i => i.name === "Spellcasting")
	if (spellFeat) {
		let spellcasterlevelMatch = spellFeat.data.description.value.match(/(?<level>\d+)\w+-level spellcaster/)
		if (spellcasterlevelMatch) {
			monster.data.details.spellLevel = spellcasterlevelMatch.groups.level
		}

		let spellabilityMatch = spellFeat.data.description.value.match(/spellcasting ability is (?<ability>\w+)/)
		if (spellabilityMatch) {
			monster.data.attributes.spellcasting = shortifyAttribute(spellabilityMatch.groups.ability)
		}
	} else {
		spellFeat = monster.items.find(i => i.name.startsWith("Innate Spellcasting"))
		if (spellFeat) {
			let spellabilityMatch = spellFeat.data.description.value.match(/spellcasting ability is (?<ability>\w+)/)
			if (spellabilityMatch) {
				monster.data.attributes.spellcasting = shortifyAttribute(spellabilityMatch.groups.ability)
			}
		}
	}

	//================== Description / Source / Environment ==================//
	monster.data.details.biography.value = document.querySelector('.detail-content .more-info-content').innerHTML
	monster.data.details.source = document.querySelector('p.monster-source').innerText
	let env = document.querySelectorAll('.environment-tag')
	if (env) {
		let envs = []
		env.forEach(e => envs.push(e.innerText))
		monster.data.details.environment = envs.join(',')
	}

	//================== Lair Actions ==================//
	let descParts = document.querySelector('.mon-details__description-block-content')
	if (descParts) {
		for (let i = 0; i < descParts.children.length; i++) {
			if (descParts.children[i].innerText !== "Lair Actions") {
				continue
			}

			let initMatch = descParts.children[i + 1].innerText.match(/on initiative (count )?(?<init>\d+)/i)
			if (initMatch != null) {
				monster.data.resources.lair.initiative = initMatch.groups.init
				monster.data.resources.lair.value = true
			}
			descParts.children[i + 2].querySelectorAll('li').forEach(la => {
				let lairAction = NewItem()
				lairAction.parseActionItem(la, "Lair")
				if (lairAction.data.attackBonus > 0) { lairAction.data.attackBonus -= profMod }
				lairAction.data.activation.cost = 1
				lairAction.data.activation.type = "lair"
				monster.items.push(lairAction)
			})
		}
	}

	//================== Token Optimizations ==================//
	if (monster.data.resources.legact.value > 0) {
		monster.token.bar2 = { attribute: "resources.legact" }
	}

	switch (monster.data.traits.size) {
		case "tiny":
			monster.token.scale = 0.5
			break
		case "sm":
			monster.token.scale = 0.8
			break
		case "lg":
			monster.token.width = 2
			monster.token.height = 2
			break
		case "huge":
			monster.token.width = 3
			monster.token.height = 3
			break
		case "grg":
			monster.token.width = 4
			monster.token.height = 4
			break
	}

	return monster
}

async function fetchSpells(doc) {
	let uris = new Set()
	let spellLinks = doc.querySelectorAll('a.tooltip-hover.spell-tooltip')
	if (!spellLinks) return []
	spellLinks.forEach(a => {
		let spellMatch = a.dataset.tooltipHref.match(/\/(?<number>\d+)-tooltip/)
		if (!spellMatch) { return }
		uris.add("https://www.dndbeyond.com/spells/" + spellMatch.groups.number + "/tooltip")
	})

	uris = [...uris]
	let spells = []
	for (let i = 0; i < uris.length; i++) {
		await fetch(uris[i], {
			method: 'GET',
			credentials: 'include',
		}).then(async (r) => {
			let body = await r.text()
			body = body.replace(/(^\()|(\)$)/g, '')
			body = JSON.parse(body)

			const parser = new DOMParser()
			const element = parser.parseFromString(body.Tooltip, "text/html")

			let spell = NewSpell()
			spell.parseSpellItem(element)

			spells.push(spell)
		}).catch(console.error)
	}

	return spells
}


function NewItem(params) {
	return {
		name: '',
		type: '',
		flags: {
			betterRolls5e: {
				critRange: { type: "String", value: "", },
				critDamage: { type: "String", value: "", },
				quickDesc: { type: "Boolean", value: false, altValue: true, },
				quickAttack: { type: "Boolean", value: true, altValue: true, },
				quickSave: { type: "Boolean", value: true, altValue: true, },
				quickDamage: { type: "Array", value: [], altValue: [], context: {} },
				quickVersatile: { type: "Boolean", value: false, altValue: false },
				quickProperties: { type: "Boolean", value: true, altValue: true },
				quickCharges: { type: "Boolean", value: true, altValue: true },
				quickTemplate: { type: "Boolean", value: true, altValue: true },
				quickOther: { type: "Boolean", value: true, altValue: true, context: "" },
				quickFlavor: { type: "Boolean", value: true, altValue: true }
			}
		},
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
			}
		},

		parseActionItem(raw, label) {
			var action = raw.innerText

			let actionName = ""
			let description = ""
			//================== Name ==================//
			if (raw.querySelectorAll('strong').length == 0 && label !== "Lair") {
				return false
			}
			[actionName, ...description] = action.split('.')
			description = description.join('.')


			this.type = "feat"
			this.name = actionName
			this.data.description.value = raw.innerHTML.replace(/ href="\//g, " href=\"https://www.dndbeyond.com")
			this.data.description.value = this.data.description.value.replace(/\<img class=\"ct-beyond20-(spell|custom)-icon\"[^\<]+\>/g, "")

			//================== Legendary Resistance ==================//
			if (this.name.startsWith("Legendary Resistance")) {
				this.data.activation.type = "special"
				this.data.consume.type = "attribute"
				this.data.consume.target = "resources.legres.value"
				this.data.consume.amount = 1

				return true
			}

			//================== Legendary Costs ==================//
			if (label === "Legendary Actions") {
				let costMatch = this.name.match(/Costs (?<cost>\d+)/)
				let cost = 1
				if (costMatch != null) {
					cost = parseInt(costMatch.groups.cost)
				}
				this.data.consume.type = "attribute"
				this.data.consume.target = "resources.legact.value"
				this.data.consume.amount = cost
				this.data.activation.cost = cost
			}

			let [actionType, ...d] = description.split(':')

			let aType = translateActionType(actionType.trim())
			if (aType) {
				this.data.actionType = aType
			}

			//================== Attack Information ==================//
			let attackMatch = action.match(/(?<attack>\d+) to hit/)
			if (attackMatch != null && attackMatch.groups.attack) {
				this.data.attackBonus = parseInt(attackMatch.groups.attack)
			}

			//================== Range Information ==================//
			let rangeMatch = action.match(/(reach|range|within) (?<range>\d+) (ft\.|feet)/)
			if (rangeMatch != null && rangeMatch.groups.range) {
				this.data.range.value = parseInt(rangeMatch.groups.range)
				this.data.range.units = "ft"
			}
			let areaMatch = action.match(/(?<size>\d+)-foot (?<shape>(cube|sphere|cone|line))/)
			if (areaMatch) {
				this.data.target.value = areaMatch.groups.size
				this.data.target.type = areaMatch.groups.shape
				this.data.target.units = "ft"
			}

			//================== Damage Information ==================//
			let damageMatches = action.match(/\d+ \((\d+d\d+( \+ \d+)?)\) (\w+) (\w+)([\s\w]+)?/g)
			if (damageMatches != null) {
				damageMatches.forEach(m => {
					let res = m.match(/\d+ \((?<damage>\d+d\d+( \+ \d+)?)\) (?<type>\w+)( damage )?(?<versatile>if used with two hands)?/)
					if (res == null) return
					if (res.groups.versatile) {
						this.data.damage.versatile = res.groups.damage
					} else {
						this.data.damage.parts.push([res.groups.damage, parseDamageType(res.groups.type)])
					}
				})
			}

			//================== Save / -DC Information ==================//
			let dcMatch = action.match(/DC (?<dc>\d+) (?<attribute>\w+)/)
			if (dcMatch != null) {
				this.data.save.dc = parseInt(dcMatch.groups.dc)
				this.data.save.ability = shortifyAttribute(dcMatch.groups.attribute)
				this.data.save.scaling = "flat"
			}

			if (this.name !== "Multiattack") {
				this.data.activation.type = translateActionActivation(label)
			}

			// if we have a save and no attack type yet this is a save actionType
			if (this.data.save.dc != null && this.data.actionType == '') {
				this.data.actionType = 'save'
			}

			//================== Recharge ==================//
			let rechargeMatch = this.name.match(/Recharge (?<value>\d)/)
			if (rechargeMatch != null) {
				this.data.recharge.charged = true
				this.data.recharge.value = rechargeMatch.groups.value
			}

			return true
		}
	}
}

function NewSpell() {
	return {
		name: '',
		type: 'spell',
		flags: {
			betterRolls5e: {
				critRange: { type: "String", value: "", },
				critDamage: { type: "String", value: "", },
				quickDesc: { type: "Boolean", value: false, altValue: true, },
				quickAttack: { type: "Boolean", value: true, altValue: true, },
				quickSave: { type: "Boolean", value: true, altValue: true, },
				quickDamage: { type: "Array", value: [], altValue: [], context: {} },
				quickVersatile: { type: "Boolean", value: false, altValue: false },
				quickProperties: { type: "Boolean", value: true, altValue: true },
				quickCharges: { type: "Boolean", value: true, altValue: true },
				quickTemplate: { type: "Boolean", value: true, altValue: true },
				quickOther: { type: "Boolean", value: true, altValue: true, context: "" },
				quickFlavor: { type: "Boolean", value: true, altValue: true }
			}
		},
		data: {
			ability: '',
			actionType: '', //eg save
			activation: {
				type: '', //eg reaction
				cost: 0,
			},
			attackBonus: null,
			components: {
				concentration: false,
				material: false,
				ritual: false,
				somatic: false,
				vocal: false,
				//value: "",
			},
			consume: {
				type: "",
				target: "",
				amount: null,
			},
			critical: null, // TODO
			damage: {
				parts: [], //eg ["1d10+4", "fire"], ["1d4", "radiant"]
				versatile: "", // TODO
			},
			description: {
				chat: '', // TODO
				value: '',
			},
			duration: {
				value: null,
				units: "",
			},
			isAttack: false,
			level: 0,
			materials: {
				consumed: false,
				cost: 0,
				supply: 0,
				value: "", //eg a sword
			},
			preparation: {
				mode: "prepared", //prepared atwill 
				prepared: true,
			},
			range: {
				value: null,
				units: '',
			},
			save: {
				ability: "",
				dc: null,
				scaling: "spell",
			},
			scaling: {
				mode: "none", //cantrim none level
				formula: "",
			},
			school: "",
			target: {
				value: null,
				units: "",
				type: "",
			},
			uses: {
				value: null,
				max: null,
				per: "", //day
			},
			formula: ""
		},

		parseSpellItem(raw) {
			this.name = raw.querySelector('.tooltip-header-text').innerText.trim()
			this.data.description.value = raw.querySelector('.tooltip-body-description-text').innerHTML.replace(/ href="\//g, " href=\"https://www.dndbeyond.com/")

			//================== Level ==================//
			let levelMatch = raw.querySelector('.tooltip-body-statblock-item-level .tooltip-body-statblock-item-value').innerText.match(/\d/)
			if (levelMatch) {
				this.data.level = parseInt(levelMatch[0])
			}

			//================== Cast-Time ==================//
			let timeText = raw.querySelector('.tooltip-body-statblock-item-castingtime .tooltip-body-statblock-item-value').innerText
			this.data.activation.cost = parseInt(timeText.match(/^(?<cost>\d+)/).groups.cost)
			this.data.activation.type = translateToSingular(timeText.split(" ")[1].trim()).toLowerCase()

			//================== Target / Range ==================//
			let rangeElem = raw.querySelector('.tooltip-body-statblock-item-range .tooltip-body-statblock-item-value')
			let rangeText = rangeElem.innerText.trim()
			let targetElem = rangeElem.querySelector('span')
			if (rangeText.match(/^\d+ ft$/)) {
				this.data.target.value = rangeText.split(" ")[0].trim()
				this.data.target.units = "ft"
				this.data.range.value = this.data.target.value
				this.data.range.units = "ft"
			} else if (targetElem) {
				let range = rangeText.split(/\s+/)
				let targetRange = targetElem.innerText.replace(/(\(|\))/, "").trim().split(" ")
				this.data.range.units = range[0].toLowerCase().trim()

				this.data.target.value = parseInt(targetRange[0])
				this.data.target.units = targetRange[1]

				let icon = targetElem.querySelector('i')
				let shapeMatch = icon.classList[0].match(/i-aoe-(?<shape>\w+)/)

				this.data.target.type = shapeMatch.groups.shape
			} else {
				if (rangeText.toLowerCase() === "touch") {
					this.data.target.units = "touch"
					this.data.range.units = "touch"
				} else {
					this.data.target.type = rangeText.toLowerCase()
				}
			}

			//================== Components ==================//
			let componentsText = raw.querySelector('.tooltip-body-statblock-item-components .tooltip-body-statblock-item-value').innerText
			componentsText.split(', ').forEach(c => {
				switch (c) {
					case "V":
						this.data.components.vocal = true
						break
					case "S":
						this.data.components.somatic = true
						break
					case "M":
						this.data.components.material = true
						break
					case "C":
						this.data.components.concentration = true
						break
					case "R":
						this.data.components.ritual = true
						break
				}
			})

			//================== Duration ==================//
			let durationText = raw.querySelector('.tooltip-body-statblock-item-duration .tooltip-body-statblock-item-value').innerText.trim()
			let parts = []
			if (durationText.startsWith("Concentration")) {
				this.data.components.concentration = true
				parts = durationText.split(/\s+/)
				parts.shift()
			} else {
				parts = durationText.split(/\s+/)
			}
			if (parts.length > 1) {
				this.data.duration.value = parts.shift()
			}
			this.data.duration.units = translateDuration(translateToSingular(parts.shift()).toLowerCase())

			//================== School ==================//
			let schoolText = raw.querySelector('.tooltip-body-statblock-item-school .tooltip-body-statblock-item-value').innerText
			if (schoolText.toLowerCase() === "transmutation") {
				this.data.school = "trs"
			} else {
				this.data.school = shortifyAttribute(schoolText)
			}

			//================== Save ==================//
			let saveText = raw.querySelector('.tooltip-body-statblock-item-save .tooltip-body-statblock-item-value').innerText.trim()
			if (saveText.split(' ').length == 2 && saveText.split(' ')[1].toLowerCase() === "save") {
				this.data.save.ability = saveText.split(" ")[0].toLowerCase()
			}

			//================== ActionType ==================//
			if (this.data.description.value.match(/make a ranged spell attack/i)) {
				this.data.actionType = "rsak"
			} else if (this.data.description.value.match(/make a melee spell attack/i)) {
				this.data.actionType = "msak"
			} else if (this.data.save.ability.length > 0) {
				this.data.actionType = "save"
			}

			//================== Damage ==================//
			let damageMatch = this.data.description.value.match(/takes (?<form>\d+d\d+) (?<type>\w+) damage/)
			if (damageMatch) {
				this.data.damage.parts.push([damageMatch.groups.form, damageMatch.groups.type])
			}

			let additionalDamageMatch = this.data.description.value.match(/and \d+d\d+ \w+ damage/g)
			if (additionalDamageMatch) {
				additionalDamageMatch.forEach(m => {
					let match = m.match(/(?<form>\d+d\d+) (?<type>\w+) damage/)
					this.data.damage.parts.push([match.groups.form, match.groups.type])
				})
			}

			//================== Other ==================//
			let otherMatch = this.data.description.value.match(/roll (?<form>\d+d\d+)/i)
			if (otherMatch) {
				this.data.actionType = "util"
				this.data.formula = otherMatch.groups.form
			}

			let damageScaleMatch = this.data.description.value.match(/(damage increases by|roll an additional) (?<form>\d+d\d+) for each slot/)
			if (damageScaleMatch) {
				this.data.scaling.mode = "level"
				this.data.scaling.formula = damageScaleMatch.groups.form
			}

			if (this.data.level == 0) {
				this.data.scaling.mode = "cantrip"
			}
		}
	}
}