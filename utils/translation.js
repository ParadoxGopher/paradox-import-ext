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
	switch (type.toLowerCase()) {
		case "melee weapon attack":
			return 'mwak'
		case "melee or ranged weapon attack":
		case "ranged weapon attack":
			return 'rwak'
		case "melee spell attack":
			return 'msak'
		case "ranged spell attack":
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

function translateToSingular(text) {
	switch (text) {
		case "hours":
		case "Hours": return "Hour"
		case "minutes":
		case "Minutes": return "Minute"
		case "rounds":
		case "Rounds": return "Round"
		default: return text
	}
}

function translateDuration(dur) {
	switch (dur) {
		case "instantaneous": return "inst"
		default: return dur
	}
}

function shortifyAttribute(attribute) {
	return attribute.substring(0, 3).toLowerCase()
}

function parseDamageType(type) {
	switch (type) {
		case "acid":
		case "bludgeoning":
		case "cold":
		case "fire":
		case "force":
		case "lightning":
		case "necrotic":
		case "piercing":
		case "poison":
		case "psychic":
		case "radiant":
		case "slashing":
		case "thunder":
		case "healing":
			return type
		case "temporary":
			return "temphp"
		default:
			return "none"
	}
}

function calcAbilityMod(score) {
	switch (score) {
		case 0:
		case 1:
			return -5
		case 2:
		case 3:
			return -4
		case 4:
		case 5:
			return -3
		case 6:
		case 7:
			return -2
		case 8:
		case 9:
			return -1
		case 10:
		case 11:
			return 0
		case 12:
		case 13:
			return 1
		case 14:
		case 15:
			return 2
		case 16:
		case 17:
			return 3
		case 18:
		case 19:
			return 4
		case 20:
			return 5
		default:
			let mod = score - 10
			return Math.floor(mod / 2)
	}
}

function translateUseType(useType) {
	switch (useType) {
		case "Short Rest":
			return "sr"
		case "Long Rest":
			return "lr"
		default:
			return useType
	}
}

function translateLevelToSpellslots(level) {
	slots = {
		spell1: { value: 0, max: 0 },
		spell2: { value: 0, max: 0 },
		spell3: { value: 0, max: 0 },
		spell4: { value: 0, max: 0 },
		spell5: { value: 0, max: 0 },
		spell6: { value: 0, max: 0 },
		spell7: { value: 0, max: 0 },
		spell8: { value: 0, max: 0 },
		spell9: { value: 0, max: 0 },
	}
	switch (level) {
		case level >= 1:
			slots.spell1.value += 2
		case level >= 2:
			slots.spell1.value++
		case level >= 3:
			slots.spell1.value++
			slots.spell2.value = 2
		case level >= 4:
			slots.spell2.value++
		case level >= 5:
			slots.spell3.value = 2
		case level >= 6:
			slots.spell3.value++
		case level >= 7:
			slots.spell4.value++
		case level >= 8:
			slots.spell4.value++
		case level >= 9:
			slots.spell5.value++
		case level >= 10:
			slots.spell5.value++
		case level >= 11:
			slots.spell6.value++
		case level >= 13:
			slots.spell7.value++
		case level >= 15:
			slots.spell8.value++
		case level >= 17:
			slots.spell9.value++
		case level >= 18:
			slots.spell5.value++
		case level >= 19:
			slots.spell6.value++
		case level >= 20:
			slots.spell7.value++
	}

	return slots
}