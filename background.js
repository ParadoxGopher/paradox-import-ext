browser.runtime.onMessage.addListener((request, sender, respond) => {
	console.log("received: ", sender, request)

	switch (request.type) {
		case "spell-response":
			browser.tabs.query({ "url": "*://*.dndbeyond.com/spells/*"}).then(sendToTabs(request)).catch(console.error)
			break
		case "monster-response":
			browser.tabs.query({ "url": "*://*.dndbeyond.com/monsters/*"}).then(sendToTabs(request)).catch(console.error)
			break
		default:
			browser.tabs.query({ "url": "*://*/game" }).then(sendToTabs(request, 1)).catch(console.error)
	}
})

function sendToTabs(message, limit = Infinity) {
	return (tabs) => {
		let count = 0
		tabs.forEach(tab => {
			if (count >= limit) return
			browser.tabs.sendMessage(tab.id, message).catch(console.error)
			count++
		});
	}
}	