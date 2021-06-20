console.error("starting")
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

	const onChangedSidebar = function () {
		console.log("changed")
		const header = document.querySelector("div.ct-sidebar__header")
		const spellManager = document.querySelector(".ct-class-spell-manager__info")
		const spellSyncButton = document.getElementById("paradox_spell_sync")

		if (spellManager && !spellSyncButton) {
			let ssb = document.createElement("button")
			ssb.textContent = "sync"
			ssb.onclick = syncSpells
			ssb.id = "paradox_spell_sync"
			spellManager.appendChild(ssb)
			return
		}

		if (!header) return

		const type = getType(document)
		if (!type) {
			console.log("no type")
			let button = document.getElementById("paradox_import_start")
			if (button) button.remove()
			return
		}
		const name = header.querySelector("div.ct-sidebar__header-primary").innerText.trim()

		const id = type + ":" + name
		console.log(id)
		let button = document.getElementById("paradox_import_start")
		if (button) {
			if (button.getAttribute("type") == id) return

			button.setAttribute("type", id)
		}

		// TODO: change request type (optional add additional button)
		browser.runtime.sendMessage(JSON.stringify({ type: "request", payload: { type: "actor_item-request", payload: name, requestId: id } }))
	}

	const observer = new MutationObserver(onChangedSidebar)
	observer.observe(targetNode, config)
})

function getOrigin(type, node) {
	switch (type) {
		case "racial":
		case "class":
			const origin = node.querySelector("div.ct-sidebar__header div.ct-sidebar__header-parent")
			if (!origin) return
			return origin.innerText
		default:
			console.log(type)
			return null
	}
}

browser.runtime.onMessage.addListener((req, s, respond) => {
	console.log(req)
	const type = getType(document)
	const name = document.querySelector("div.ct-sidebar__header-primary").innerText.trim()

	let id = type + ":" + name

	if (req.type !== "actor_item-response" || req.requestId !== id) return

	const header = document.querySelector("div.ct-sidebar__pane-gap.ct-sidebar__pane-gap--top")

	let text = req.payload ? "update" : "import"
	let button = document.getElementById("paradox_import_start")
	if (!button) {
		button = document.createElement("button")
		button.id = "paradox_import_start"
		let textNode = document.createTextNode(text)
		button.setAttribute("type", id)
		button.appendChild(textNode)

		header.appendChild(button)
	} else {
		if (button.getAttribute("type" != id)) return
	}

	button.textContent = text
	header.style.height = "30px"

	button.onclick = parse
})

function parse() {
	let type = getType(document)

	let item = null
	switch (type) {
		case "action":
			item = parseAction()
			break
		case "item":
			item = parseItem()
			break
		case "spell":
			item = parseSpell()
			break
		case "class":
			item = parseFeat()
			break
	}

	let message = {
		type: "actor_item",
		replace: true,
		payload: item
	}

	console.log(item)
	browser.runtime.sendMessage(JSON.stringify(message))
}

function getType(node) {
	const content = node.querySelector("div.ct-sidebar__pane-content > div")
	if (!node) return

	const typeMatch = content.className.match(/ct-(?<type>\w+)-/)
	if (!typeMatch || !typeMatch.groups) return
	const type = typeMatch.groups.type

	return type
}

async function syncSpells(c) {
	console.log("starting sync")
	c.target.disabled = true

	let spells = []
	const spellManager = document.querySelector(".ct-spell-manager")
	spellManager.querySelectorAll(".ct-spell-manager__spell .ddbc-collapsible__header").forEach(s => {
		const state = s.querySelector(".ct-spell-manager__spell-header-actions button span").innerText

		if (state == "LEARN") return

		s.click()
		const spell = parseSpellbookSpell(s)
		spell.data.preparation = {
			mode: "prepared",
			prepared: state !== "PREPARE",
		}
		
		spells.push(spell)

		s.click()

	})

	for (let index in spells) {

		let message = {
			type: "actor_item",
			replace: false,
			payload: spells[index]
		}

		browser.runtime.sendMessage(JSON.stringify(message))

		await Sleep(200)

	}

	c.target.disabled = false
	console.log("done syncing")
}

function parseSpellbookSpell(s) {
	const content = s.nextSibling

	let item = NewItem()
	item.type = "spell"
	item.name = s.querySelector(".ddbc-spell-name").childNodes[0].textContent
	
	if (item.name == "+") item.name = s.querySelector(".ddbc-spell-name").childNodes[1].textContent

	item.data.description.value = content.querySelector(".ct-spell-detail__description").innerHTML


	const schoolLevelNodes = content.querySelectorAll(".ct-spell-detail__level-school .ct-spell-detail__level-school-item")

	let schoolText = ""
	let level = 0
	if (content.querySelector(".ct-spell-detail__level-school").innerText.match(/Cantrip/)) {
		schoolText = schoolLevelNodes[0].innerText
	} else {
		schoolText = schoolLevelNodes[1].innerText
		const levelMatch = schoolLevelNodes[0].innerText.match(/^(?<level>\d)\w+ Level$/)
		if (levelMatch) {
			level = parseInt(levelMatch.groups.level)
		}
	}

	if (schoolText.toLowerCase() === "transmutation") {
		item.data.school = "trs"
	} else {
		item.data.school = shortifyAttribute(schoolText)
	}

	item.data.level = level

	item.data.components = {
		concentration: false,
		material: false,
		ritual: false,
		somatic: false,
		vocal: false,
		//value: "",
	}

	content.querySelectorAll(".ddbc-property-list .ddbc-property-list__property").forEach(p => {
		const label = p.querySelector(".ddbc-property-list__property-label").innerText.trim()
		const value = p.querySelector(".ddbc-property-list__property-content").innerText.trim()

		switch (label) {
			case "Components:":
				value.split(', ').forEach(c => {
					switch (c) {
						case "V":
							item.data.components.vocal = true
							break
						case "S":
							item.data.components.somatic = true
							break
						case "M":
							item.data.components.material = true
							break
						case "C":
							item.data.components.concentration = true
							break
						case "R":
							item.data.components.ritual = true
							break
					}
				})

				const materialNode = p.querySelector(".ct-spell-detail__components-description")
				if (materialNode) {
					item.data.materials = {
						value: materialNode.childNodes[1].innerText
					}
				}

				break
			case "Casting Time:":
				const castTimeUnitMatch = value.match(/(?<value>\d+) (?<unit>\w+)/)
				if (castTimeUnitMatch && castTimeUnitMatch.groups) {
					item.data.activation.cost = parseInt(castTimeUnitMatch.groups.value)
					item.data.activation.type = translateToSingular(castTimeUnitMatch.groups.unit).toLowerCase()
				}
				break
			case "Duration:":
				if (value == "Instantaneous") {
					item.data.duration.units = "inst"
					break
				}
				const durationTimeUnitMatch = value.match(/(?<value>\d+) (?<unit>\w+)/)
				if (durationTimeUnitMatch && durationTimeUnitMatch.groups) {
					item.data.duration.value = parseInt(durationTimeUnitMatch.groups.value)
					item.data.duration.units = translateToSingular(durationTimeUnitMatch.groups.unit).toLowerCase()
				}
				if (value.match(/Concentration/)) {
					item.data.components.concentration = true
				}
				break
			case "Source:":
				item.data.source = value
				break
			case "Range/Area:":
				// self
				if (value == "Self" || value == "Touch") {
					item.data.range.units = value.toLowerCase()
					break
				}
				const node = p.querySelector(".ddbc-property-list__property-content")
				// range
				let rangeString = node.childNodes[0].wholeText
				if (!rangeString) {
					rangeString = node.childNodes[0].innerText
				}

				if (rangeString.endsWith("/")) {
					rangeString = rangeString.substring(0, rangeString.length - 1)
				}
				if (rangeString.endsWith("ft.")) {
					rangeString = rangeString.substring(0, rangeString.length - 3)
				}

				item.data.range.value = rangeString
				item.data.range.units = "ft"

				if (item.data.range.value == "Self" || item.data.range.value == "Touch") {
					item.data.range.units = item.data.range.value.toLowerCase()
					item.data.range.value = null
				}

				// range and area
				if (node.childNodes.length > 2) {
					// area
					item.data.target.value = node.childNodes[2].querySelector(".ddbc-distance-number__number").innerText
					item.data.target.units = "ft"
					const iconMatch = p.querySelector(".ct-spell-detail__range-icon").className.match(/i-aoe-(?<type>\w+)/)
					if (iconMatch && iconMatch.groups) {
						item.data.target.type = iconMatch.groups.type
					}
				}
				break
			case "Attack/Save:":
				item.data.actionType = "save"
				item.data.save.ability = value.split(" ")[0].toLowerCase()
				item.data.save.dc = value.split(" ")[1]
				break
		}
	})

	content.querySelectorAll(".ct-spell-caster__modifier").forEach((mod, i) => {
		const form = mod.querySelector(".ct-spell-caster__modifier-amount").innerText
		const typeMatch = mod.querySelector(".ddbc-damage-type-icon__img").className.match(/i-type-(?<type>\w+)/)
		const contextNode = mod.querySelector(".ct-spell-caster__modifier-restriction")

		if (contextNode) {
			const context = contextNode.innerText.substring(1, contextNode.innerText.length - 1)
			item.data.damage.parts.push([form, typeMatch.groups.type, context])
			item.flags.betterRolls5e.quickDamage.context[i] = context
		} else {
			item.data.damage.parts.push([form, typeMatch.groups.type])
		}
	})

	if (item.data.damage.parts.length > 0) {
		let scaling = "cantrip"
		let form = ""
		const diceMatch = item.data.damage.parts[0][0].match(/\d+(?<dice>d\d+)/)
		if (diceMatch) {
			form = "1" + diceMatch.groups.dice
		} else {
			form = item.data.damage.parts[0][0]
		}
		if (item.data.level > 0) {
			scaling = "level"
		}
		item.data.scaling = {
			formula: form,
			mode: scaling
		}
	}

	const actionTypeMatch = content.querySelector(".ct-spell-detail__description").innerText.match(/(?<type>(melee|ranged) (weapon|spell) attack)/)
	if (actionTypeMatch) {
		item.data.actionType = translateActionType(actionTypeMatch.groups.type)
	}

	return item
}

function parseSpell() {
	let item = NewItem()
	item.type = "spell"
	item.name = document.querySelector(".ct-sidebar__heading .ddbc-spell-name").innerText
	item.data.description.value = document.querySelector(".ct-spell-detail__description").innerHTML

	const schoolLevelNodes = document.querySelectorAll(".ct-spell-detail__level-school .ct-spell-detail__level-school-item")

	let schoolText = ""
	let level = 0
	if (document.querySelector(".ct-spell-detail__level-school").innerText.match(/Cantrip/)) {
		schoolText = schoolLevelNodes[0].innerText
	} else {
		schoolText = schoolLevelNodes[1].innerText
		const levelMatch = schoolLevelNodes[0].innerText.match(/^(?<level>\d)\w+ Level$/)
		if (levelMatch) {
			level = parseInt(levelMatch.groups.level)
		}
	}

	if (schoolText.toLowerCase() === "transmutation") {
		item.data.school = "trs"
	} else {
		item.data.school = shortifyAttribute(schoolText)
	}

	item.data.level = level

	item.data.components = {
		concentration: false,
		material: false,
		ritual: false,
		somatic: false,
		vocal: false,
		//value: "",
	}

	document.querySelectorAll(".ddbc-property-list .ddbc-property-list__property").forEach(p => {
		const label = p.querySelector(".ddbc-property-list__property-label").innerText.trim()
		const value = p.querySelector(".ddbc-property-list__property-content").innerText.trim()

		switch (label) {
			case "Components:":
				value.split(', ').forEach(c => {
					switch (c) {
						case "V":
							item.data.components.vocal = true
							break
						case "S":
							item.data.components.somatic = true
							break
						case "M":
							item.data.components.material = true
							break
						case "C":
							item.data.components.concentration = true
							break
						case "R":
							item.data.components.ritual = true
							break
					}
				})

				const materialNode = p.querySelector(".ct-spell-detail__components-description")
				if (materialNode) {
					item.data.materials = {
						value: materialNode.childNodes[1].innerText
					}
				}

				break
			case "Casting Time:":
				const castTimeUnitMatch = value.match(/(?<value>\d+) (?<unit>\w+)/)
				if (castTimeUnitMatch && castTimeUnitMatch.groups) {
					item.data.activation.cost = parseInt(castTimeUnitMatch.groups.value)
					item.data.activation.type = translateToSingular(castTimeUnitMatch.groups.unit).toLowerCase()
				}
				break
			case "Duration:":
				if (value == "Instantaneous") {
					item.data.duration.units = "inst"
					break
				}
				const durationTimeUnitMatch = value.match(/(?<value>\d+) (?<unit>\w+)/)
				if (durationTimeUnitMatch && durationTimeUnitMatch.groups) {
					item.data.duration.value = parseInt(durationTimeUnitMatch.groups.value)
					item.data.duration.units = translateToSingular(durationTimeUnitMatch.groups.unit).toLowerCase()
				}
				if (value.match(/Concentration/)) {
					item.data.components.concentration = true
				}
				break
			case "Source:":
				item.data.source = value
				break
			case "Range/Area:":
				// self
				if (value == "Self" || value == "Touch") {
					item.data.range.units = value.toLowerCase()
					break
				}
				const node = p.querySelector(".ddbc-property-list__property-content")
				// range
				let rangeString = node.childNodes[0].wholeText
				if (!rangeString) {
					rangeString = node.childNodes[0].innerText
				}

				if (rangeString.endsWith("/")) {
					rangeString = rangeString.substring(0, rangeString.length - 1)
				}
				if (rangeString.endsWith("ft.")) {
					rangeString = rangeString.substring(0, rangeString.length - 3)
				}

				item.data.range.value = rangeString
				item.data.range.units = "ft"

				if (item.data.range.value == "Self" || item.data.range.value == "Touch") {
					item.data.range.units = item.data.range.value.toLowerCase()
					item.data.range.value = null
				}

				// range and area
				if (node.childNodes.length > 2) {
					// area
					item.data.target.value = node.childNodes[2].querySelector(".ddbc-distance-number__number").innerText
					item.data.target.units = "ft"
					const iconMatch = p.querySelector(".ct-spell-detail__range-icon").className.match(/i-aoe-(?<type>\w+)/)
					if (iconMatch && iconMatch.groups) {
						item.data.target.type = iconMatch.groups.type
					}
				}
				break
			case "Attack/Save:":
				item.data.actionType = "save"
				item.data.save.ability = value.split(" ")[0].toLowerCase()
				item.data.save.dc = value.split(" ")[1]
				break
		}
	})

	document.querySelectorAll(".ct-spell-caster__modifier").forEach((mod, i) => {
		const form = mod.querySelector(".ct-spell-caster__modifier-amount").innerText
		const typeMatch = mod.querySelector(".ddbc-damage-type-icon__img").className.match(/i-type-(?<type>\w+)/)
		const contextNode = mod.querySelector(".ct-spell-caster__modifier-restriction")

		if (contextNode) {
			const context = contextNode.innerText.substring(1, contextNode.innerText.length - 1)
			item.data.damage.parts.push([form, typeMatch.groups.type, context])
			item.flags.betterRolls5e.quickDamage.context[i] = context
		} else {
			item.data.damage.parts.push([form, typeMatch.groups.type])
		}
	})

	if (item.data.damage.parts.length > 0) {
		let scaling = "cantrip"
		let form = ""
		const diceMatch = item.data.damage.parts[0][0].match(/\d+(?<dice>d\d+)/)
		if (diceMatch) {
			form = "1" + diceMatch.groups.dice
		} else {
			form = item.data.damage.parts[0][0]
		}
		if (item.data.level > 0) {
			scaling = "level"
		}
		item.data.scaling = {
			formula: form,
			mode: scaling
		}
	}

	const actionTypeMatch = document.querySelector(".ct-spell-detail__description").innerText.match(/(?<type>(melee|ranged) (weapon|spell) attack)/)
	if (actionTypeMatch) {
		item.data.actionType = translateActionType(actionTypeMatch.groups.type)
	}

	return item
}

function parseItem() {
	let item = NewItem()
	const itemTypeAndRarity = document.querySelector('.ct-item-detail__intro').innerText.split(',')
	//const itemTypeMatch = itemTypeAndRarity[0].trim().match(/(?<type>\w+)\s/)
	//const itemType = itemTypeMatch.groups.type

	const itemRarity = itemTypeAndRarity[1].trim().split(" ", 1)[0]
	if (itemTypeAndRarity[1].match(/requires attunement/)) {
		item.data.attunement = 1
	}
	item.name = document.querySelector('.ct-sidebar__heading .ddbc-item-name').innerText.trim()
	item.data.rarity = itemRarity
	item.data.activation.type = "action"
	item.data.activation.cost = 1

	item.data.properties = {
		ada: false,
		amm: false,
		fin: false,
		fir: false,
		foc: false,
		hvy: false,
		lgt: false,
		lod: false,
		mgc: false,
		rch: false,
		rel: false,
		ret: false,
		sil: false,
		spc: false,
		thr: false,
		two: false,
		ver: false
	}

	item.data.description.value = document.querySelector('.ddbc-html-content.ct-item-detail__description.ct-item-detail__description--rich').innerHTML

	const weaponProperties = document.querySelectorAll('.ct-item-pane .ddbc-property-list__property')
	weaponProperties.forEach(wp => {
		switch (wp.querySelector('.ddbc-property-list__property-label').innerText) {
			case "Attack Type:":
				switch (wp.querySelector('.ddbc-property-list__property-content').innerText) {
					case "Melee":
						item.data.actionType = "mwak"
						break
					case "Ranged":
						item.data.actionType = "rwak"
						break
				}
				break
			case "Range:":
				const rangeStr = wp.querySelector('.ddbc-property-list__property-content').innerText
				const rangeMatch = rangeStr.match(/(?<min>\d+)\s?ft\.\/(?<max>\d+)\s?ft\./)
				if (rangeMatch && rangeMatch.groups) {
					item.data.range.units = "ft"
					item.data.range.value = rangeMatch.groups.min
					if (rangeMatch.groups.max) {
						item.data.range.long = rangeMatch.groups.max
					}
				}
				break
			case "Reach:":
				if (item.data.range.value) break

				const reachStr = wp.querySelector('.ddbc-property-list__property-content').innerText
				const reachMatch = reachStr.match(/(?<reach>\d+)\s?ft\./)
				if (reachMatch && reachMatch.groups) {
					item.data.range.units = "ft"
					item.data.range.value = reachMatch.groups.reach
				}
				break
			case "Proficient:":
				const profStr = wp.querySelector('.ddbc-property-list__property-content').innerText
				item.data.proficient = profStr.toLowerCase() == "yes"
				break

			case "Damage:":
				item.flags.betterRolls5e.quickDamage = {
					context: {
						0: ""
					}
				}

				const damageForm = wp.querySelector('.ddbc-property-list__property-content .ddbc-damage__value').innerText
				const damageMatch = damageForm.match(/(?<dice>\d+d\d+)(?<op>\+|-)(?<mod>)/)
				const versatileForm = wp.querySelector('.ddbc-property-list__property-content .ct-item-detail__versatile-damage').innerText
				const versatileMatch = versatileForm.match(/(?<dice>\d+d\d+)(?<op>\+|-)(?<mod>)/)
				if (versatileMatch && versatileMatch.groups) {
					item.data.damage.versatile = versatileMatch.groups.dice + "+@mod"
				}

				const magicBonus = item.data.description.value.match(/a \+(?<bonus>\d) bonus to attack and damage rolls/)
				if (magicBonus && magicBonus.groups) {
					item.data.attackBonus = magicBonus.groups.bonus
				}

				if (damageMatch && damageMatch.groups) {
					item.data.damage.parts.push([damageMatch.groups.dice + "+@mod"])
				} else {
					item.data.damage.parts.push([damageForm])
				}

				item.data.flags

				const additionalDamage = wp.querySelectorAll(".ct-item-detail__additional-damage")
				if (additionalDamage) {
					additionalDamage.forEach((ad, i) => {
						const dmg = ad.childNodes[0].wholeText
						const dmgContext = ad.querySelector(".ct-item-detail__additional-damage-info").innerText
						const dmgType = ad.querySelector(".ddbc-damage-type-icon > span").getAttribute("data-original-title").toLowerCase()

						item.data.damage.parts.push([dmg, dmgType, dmgContext])
						item.flags.betterRolls5e.quickDamage.context[i + 1] = dmgContext
					})
				}

				break
			case "Damage Type:":
				const damageType = wp.querySelector('.ddbc-property-list__property-content').innerText.trim().toLowerCase()
				item.data.damage.parts[0].push(damageType)
				break
			case "Properties:":
				/*  properties:
						ada: false
						amm: false *
						fin: false *
						fir: false
						foc: false
						hvy: false *
						lgt: false *
						lod: false *
						mgc: false
						rch: false
						rel: false
						ret: false
						sil: false
						spc: false
						thr: false *
						two: false *
						ver: false * 
				*/
				const props = wp.querySelector('.ddbc-property-list__property-content').innerText
				props.split(', ').forEach(p => {
					switch (p) {
						case "Finesse":
							item.data.properties.fin = true
							break
						case "Light":
							item.data.properties.lgt = true
							break
						case "Thrown":
							item.data.properties.thr = true
							break
						case "Heavy":
							item.data.properties.hvy = true
							break
						case "Two-Handed":
							item.data.properties.two = true
							break
						case "Ammunition":
							item.data.properties.amm = true
							break
						case "Loading":
							item.data.properties.lod = true
							break
						case "Versatile (1d8)":
						case "Versatile (1d10)":
							item.data.properties.ver = true
							break
					}
				})
				break
		}
	})

	// define weapon type at last
	const tags = Array.from(document.querySelectorAll(".ct-item-detail__tag"))
	console.log(tags)
	// 1. if we can do attacks it should be a weapon
	if (item.data.actionType == "mwak" || item.data.actionType == "rwak") {
		item.type = "weapon"
	} else /* 2. check for consumables */ if (tags.find(t => t.innerText == "CONSUMABLE")) {
		item.type = "consumable"
	} else /* 3. check for container */ if (tags.find(t => t.innerText == "CONTAINER")) {
		item.type = "backpack"
	} else /* 4. utility is a tool */ if (tags.find(t => t.innerText == "UTILITY")) {
		item.type = "tool"
	} else if (tags.find(t => t.innerText == "COMBAT" || t.innerText == "BUFF")) {
		item.type = "equipment"
	} else {
		item.type = "loot"
	}

	// in case we have a quantity
	const quantity = document.querySelector(".ct-simple-quantity__input")
	if (quantity) {
		item.data.quantity = parseInt(quantity.value)
	}

	return item
}

function parseAction() {
	let item = NewItem()
	item.type = "feat"
	item.name = document.querySelector("div.ct-sidebar__header-primary").innerText.trim()
	item.data.actionType = "action"

	item.data.description.value = document.querySelector(".ct-action-detail__description").innerHTML

	// uses
	const uses = document.querySelector(".ct-action-detail__limited-uses-manager .ct-slot-manager")
	if (uses) {
		item.data.uses.value = uses.children.length
		item.data.uses.max = uses.children.length

		//TODO: might need adjustment for other cases
		const shortMatch = item.data.description.value.match(/finish a short or long rest/)
		if (shortMatch) {
			item.data.uses.per = "sr"
		} else {
			// only check long if no short was found
			const longMatch = item.data.description.value.match(/regain all expended uses of it when you finish a long rest/)
			if (longMatch) {
				item.data.uses.per = "lr"
			}
		}
	}

	// properties
	const properties = document.querySelectorAll(".ddbc-property-list .ddbc-property-list__property")
	properties.forEach(p => {
		const label = p.querySelector(".ddbc-property-list__property-label").innerText.trim()
		const value = p.querySelector(".ddbc-property-list__property-content").innerText.trim()

		switch (label) {
			case "Action Type:":
				const actionMatch = value.match(/(?<count>\d)\s(?<type>\w+)/)
				if (actionMatch && actionMatch.groups) {
					item.data.activation.cost = actionMatch.groups.count
					item.data.activation.type = actionMatch.groups.type.toLowerCase()
				} else {
					item.data.activation.type = value.toLowerCase()
				}
				break
			case "Range/Area:":
				if (value.startsWith("--")) break
				item.data.range.units = "ft"
				item.data.range.value = p.querySelector(".ddbc-property-list__property-content .ddbc-distance-number__number").innerText.trim()
				break
			case "Attack/Save:":
				const save = value.split(" ")
				item.data.actionType = "save"
				item.data.save.ability = save[0].toLowerCase()
				item.data.save.dc = save[1]
				break
			case "Damage:":
				let damage = []
				damage.push(value)
				let damageType = ""
				properties.forEach(p => {
					const label = p.querySelector(".ddbc-property-list__property-label").innerText.trim()
					const value = p.querySelector(".ddbc-property-list__property-content").innerText.trim()

					if (label !== "Damage Type:") return
					damageType = value.toLowerCase()
				})

				if (damageType) {
					damage.push(damageType)
				}

				item.data.damage.parts.push(damage)
				break
		}
	})

	return item
}

function parseFeat() {
	let feat = NewItem()
	feat.type = 'feat'
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

	return feat
}

function NewItem() {
	return {
		name: '',
		type: '',
		flags: {
			betterRolls5e: {
				quickDamage: {
					context: {}
				}
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
			rarity: null,
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
