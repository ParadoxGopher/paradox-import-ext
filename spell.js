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
			attackBonus: 0,
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
			this.data.description.value = raw.querySelector('.tooltip-body-description-text').innerHTML.replace(/ href="\//g, " href=\"https://www.dndbeyond.com")

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