
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