const ItemImportEvent = "paradox-import:incoming:item"
const MonsterImportEvent = "paradox-import:incoming:monster"
const RequestEvent = "paradox-import:request"
const ResponseEvent = "paradox-import:response"

browser.runtime.onMessage.addListener((req, s, respond) => {
	r = JSON.parse(req)
	console.log("ParadoxExtension", r)

	switch (r.type) {
		case "request":
			document.dispatchEvent(new CustomEvent(RequestEvent, { detail: JSON.stringify(r.payload) }))
			break
		case 'item':
			document.dispatchEvent(new CustomEvent(ItemImportEvent, { detail: JSON.stringify(r.payload) }))
			break
		case 'monster':
			document.dispatchEvent(new CustomEvent(MonsterImportEvent, { detail: JSON.stringify(r.payload) }))
			break
		default:
			console.error("received unknown message type: " + r.type)
	}
})

document.addEventListener(ResponseEvent, e => {
	browser.runtime.sendMessage(JSON.parse(e.detail)).then(console.log).catch(console.error)
})