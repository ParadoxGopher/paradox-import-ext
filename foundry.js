browser.runtime.onMessage.addListener((req, s, respond) => {
	r = JSON.parse(req)
	console.log("ParadoxExtension", r)

	switch (r.type) {
		case 'item':
			document.dispatchEvent(new CustomEvent("paradox-import:incoming:item", { detail: JSON.stringify(r.payload) }))
			break
		case 'monster':
			document.dispatchEvent(new CustomEvent("paradox-import:incoming:monster", { detail: JSON.stringify(r.payload) }))
			break
		default:
			console.error("received unknown message type: " + r.type)
			respond("received unknown message type: " + r.type)
	}

	respond("kthxbye")
})
