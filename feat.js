let header = document.querySelector('.page-heading__suffix')
let name = document.querySelector('.page-title').innerText.trim()
let requestId = name

console.log("startup")

browser.runtime.sendMessage(JSON.stringify({ type: "request", payload: { type: "feat-request", payload: name, requestId: requestId } }))

browser.runtime.onMessage.addListener((req, s, respond) => {
	console.log(req)
	if (req.type !== "feat-response" || req.requestId !== requestId) return
	let text = req.payload ? "update" : "import"
	if (!document.getElementById('paradox_import_start')) {
		let button = document.createElement("button")
		let textNode = document.createTextNode(text)
		button.appendChild(textNode)
		button.id = "paradox_import_start"

		header.appendChild(button)
	}

	document.getElementById('paradox_import_start').onclick = async () => {
		let feat = NewFeat()
		feat.name = document.querySelector('header.page-header h1.page-title').innerText
		feat.data.source = document.querySelector('div.source.source-description').innerText

		let body = document.querySelector('div.details-container.details-container-feat > div.details-container-content')
		feat.data.description.value = body.innerHTML.replace(/ href="\//g, " href=\"https://www.dndbeyond.com/")
		feat.data.description.value = feat.data.description.value.replace(/<div class="image-container">\n\s*<img .*\n\s*<\/div>\n/, "")
		feat.data.description.value = feat.data.description.value.replace(/<script.*\n/, "")
		feat.data.description.value = feat.data.description.value.replace(/<div class="source source-description">\n.*\n\s*<\/div>\n/, "")

		console.log(feat)

		msg = {
			type: "item",
			payload: feat,
		}

		browser.runtime.sendMessage(JSON.stringify(msg))
	}
})

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
			}
		}
	}
}