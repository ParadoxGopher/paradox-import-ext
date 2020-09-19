
let header = document.querySelector('.page-heading__content')

header.innerHTML += '<button id="paradox_import_start">Import</button>'

// TODO: remove import button if already in compendium
let button = document.getElementById('paradox_import_start')
button.onclick = () => {
	let e = {}
	e.name = header.querySelector('.page-title').innerHTML.trim()
	let details = document.querySelector('.details-container-content-description .details-container-content-description-text:nth-child(1)')
	e.type = details.children[0].innerHTML.trim()
	e.data = {
		price: parseInt(details.children[1].innerHTML.replace('gp', '').trim()),
		weight: parseInt(details.children[2].innerHTML.trim().replace('--', '0')),
		description: {
			value: document.querySelector('.details-container-content-description .details-container-content-description-text:nth-child(3)').innerHTML.trim()
		}
	}
	console.log(e)

	if (e.type != "Gemstone") {
		console.error("currently only 'Gemstones' need to be imported")
		return
	}
	e.type = "loot"

	msg = {
		type: "item",
		payload: e,
	}

	browser.runtime.sendMessage(JSON.stringify(msg)).then((m) => console.log(m), (e) => console.error(e))
}