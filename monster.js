let header = document.querySelector('.page-heading__suffix')
if (!document.getElementById('paradox_import_start')) {
	header.innerHTML += '<button id="paradox_import_start">Import</button>'
}

document.getElementById('paradox_import_start').onclick = () => {
	// TODO: extract as class with parse functions decouple dndbeyond and foundry views
	let monster = {
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
				spellcasting: "int",
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
			//spells: {},
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
	// TODO: get image 

	//================== Name ==================//
	monster.name = document.querySelector('a.mon-stat-block__name-link').innerText.trim()

	//================== Meta ==================//
	let meta = document.querySelector('.mon-stat-block__meta').innerHTML
	let parts = meta.split(',')
	let sizeType = parts[0].split(' ')
	monster.data.traits.size = translateSize(sizeType[0].trim())
	monster.data.details.type = sizeType[1].trim()
	monster.data.details.alignment = parts[1].trim()

	//================== AC/HP/Speed ==================//
	let acHpSpeed = document.querySelectorAll('.mon-stat-block__attributes .mon-stat-block__attribute')
	monster.data.attributes.ac.value = parseInt(acHpSpeed[0].querySelector('.mon-stat-block__attribute-data-value').innerText.trim())
	monster.data.attributes.hp.value = parseInt(acHpSpeed[1].querySelector('.mon-stat-block__attribute-data-value').innerText.trim())
	monster.data.attributes.hp.max = monster.data.attributes.hp.value
	monster.data.attributes.hp.formula = acHpSpeed[1].querySelector('.mon-stat-block__attribute-data-extra').innerText.replace('(', '').replace(')', '').trim()
	monster.data.attributes.speed.value = acHpSpeed[2].querySelector('.mon-stat-block__attribute-data-value').innerText.trim()
	// TODO: special speeds

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
				monster.data.traits.senses = data.innerText.trim()
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
	document.querySelectorAll('.mon-stat-block__description-block').forEach(b => {
		var label = ''
		var heading = b.querySelector('.mon-stat-block__description-block-heading')
		if (heading) {
			label = heading.innerText
		}
		var data = b.querySelector('.mon-stat-block__description-block-content')

		data.querySelectorAll('p').forEach(p => {
			let feat = NewItem()
			if (!feat.parseActionItem(p, label)) {
				if (label === "Legendary Actions") {
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
				}
				return
			}
			if (feat.data.attackBonus > 0) { feat.data.attackBonus -= profMod }
			monster.items.push(feat)
		})
	})

	//================== Legendary Resistance ==================//
	let desc = document.querySelector('.mon-stat-block__description-blocks')
	let legresMatch = desc.innerText.match(/Legendary Resistance \((?<legres>\d+)\//)
	if (legresMatch != null) {
		monster.data.resources.legres.value = legresMatch.groups.legres
		monster.data.resources.legres.max = legresMatch.groups.legres
	}

	//================== Spellcasting ==================//
	let spellFeat = monster.items.find(i => i.name === "Spellcasting")
	let spellcasterlevelMatch = spellFeat.data.description.value.match(/(?<level>\d+)\w+-level spellcaster/)
	if (spellcasterlevelMatch != null) {
		monster.data.details.spellLevel = spellcasterlevelMatch.groups.level
	}

	let spellabilityMatch = spellFeat.data.description.value.match(/spellcasting ability is (?<ability>\w+)/)
	if (spellabilityMatch != null) {
		monster.data.attributes.spellcasting = shortifyAttribute(spellabilityMatch.groups.ability)
	}

	//================== Description / Source / Environment ==================//
	monster.data.details.biography.value = document.querySelector('.detail-content .more-info-content').innerHTML
	monster.data.details.source = document.querySelector('p.monster-source').innerText
	let env = document.querySelector('.environment-tag')
	if (env) {
		monster.data.details.environment = env.innerText
	}

	//================== Lair Actions ==================//
	let descParts = document.querySelector('.mon-details__description-block-content').children
	for (let i = 0; i < descParts.length; i++) {
		if (descParts[i].innerText !== "Lair Actions") {
			continue
		}

		let initMatch = descParts[i + 1].innerText.match(/on initiative (count )?(?<init>\d+)/i)
		if (initMatch != null) {
			monster.data.resources.lair.initiative = initMatch.groups.init
			monster.data.resources.lair.value = true
		}
		descParts[i + 2].querySelectorAll('li').forEach(la => {
			let lairAction = NewItem()
			lairAction.parseActionItem(la, "Lair")
			if (lairAction.data.attackBonus > 0) { lairAction.data.attackBonus -= profMod }
			lairAction.data.activation.cost = 1
			lairAction.data.activation.type = "lair"
			monster.items.push(lairAction)
		})
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

	msg = {
		type: "monster",
		payload: monster,
	}

	browser.runtime.sendMessage(JSON.stringify(msg)).then(console.log, console.error)
}

/***********************
 * tiny => tiny        *
 * small => sm         *
 * medium => med       *
 * large => lg         *
 * huge => huge        *
 * gargantuan => grg   *
 **********************/
function translateSize(size) {
	switch (size.toLowerCase()) {
		case "small": return "sm"
		case "medium": return "med"
		case "large": return "lg"
		case "gargantuan": return "grg"
		default: return size
	}
}

function challengeRatingToProfMod(cr) {
	switch (true) {
		case cr > 28: return 9
		case cr > 24: return 8
		case cr > 20: return 7
		case cr > 16: return 6
		case cr > 12: return 5
		case cr > 8: return 4
		case cr > 4: return 3
		default: return 2
	}
}

function translateSkills(skill) {
	switch (skill.toLowerCase()) {
		case "acrobatics": return "acr"
		case "animal handling": return "ani"
		case "arcana": return "arc"
		case "athletics": return "ath"
		case "deception": return "dec"
		case "history": return "his"
		case "insight": return "ins"
		case "investigation": return "inv"
		case "intimidation": return "itm"
		case "medicine": return "med"
		case "nature": return "nat"
		case "persuasion": return "per"
		case "perception": return "prc"
		case "performance": return "prf"
		case "religion": return "rel"
		case "sleight of hand": return "slt"
		case "stealth": return "ste"
		case "survival": return "sur"
	}
}

function translateActionType(type) {
	switch (type) {
		case "Melee Weapon Attack":
			return 'mwak'
		case "Ranged Weapon Attack":
			return 'rwak'
		case "Melee Spell Attack":
			return 'msak'
		case "Ranged Spell Attack":
			return 'rsak'
	}

	return null
}

function translateActionActivation(raw) {
	switch (raw) {
		case "Actions":
			return "action"
		case "Reactions":
			return "reaction"
		case "Legendary Actions":
			return "legendary"
	}

	return raw
}

function translateNumber(number) {
	switch (number.toLowerCase()) {
		case "one": return 1
		case "two": return 2
		case "three": return 3
		case "four": return 4
		case "five": return 5
		case "six": return 6
		case "seven": return 7
		case "eight": return 8
		case "nine": return 9
		case "ten": return 10
		case "eleven": return 11
		case "twelve": return 12
		case "thirteen": return 13
		case "fourteen": return 14
		case "sixteen": return 16
		case "seventeen": return 17
		case "eighteen": return 18
		case "nineteen": return 19
		case "twenty": return 20
	}
}

function shortifyAttribute(attribute) {
	return attribute.substring(0, 3).toLowerCase()
}

function NewItem(params) {
	return {
		name: '',
		type: '',
		flags: {
			betterRolls5e: {
				quickDesc: { type: "Boolean", value: false, altValue: true },
				quickDamage: { context: {} },
			}
		},
		data: {
			ability: '',
			actionType: '', //eg save
			activation: {
				type: '', //eg reaction
				cost: 0,
			},
			attackBonus: 0,
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
			chatFlavour: '', // TODO
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
			this.data.description.value = raw.innerHTML.replace(/href="/g, "href=\"https://www.dndbeyond.com")
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
			if (aType != null) {
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

			//================== Damage Information ==================//
			let damageMatches = action.match(/\d+ \((\d+d\d+( \+ \d+)?)\) (\w+) (\w+)/g)
			if (damageMatches != null) {
				damageMatches.forEach(m => {
					let res = m.match(/\d+ \((?<damage>\d+d\d+( \+ \d+)?)\) (?<type>\w+) damage/)
					if (res == null) return
					this.data.damage.parts.push([res.groups.damage, res.groups.type])
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