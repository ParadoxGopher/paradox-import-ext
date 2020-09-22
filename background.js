browser.runtime.onMessage.addListener((request, sender, respond) => {
	console.log("received: ", sender, request)
	respond("kthxbye")

	switch (request.type) {
		case "spell-response":
			browser.tabs.query({ "url": "*://*.dndbeyond.com/spells/*"}).then(sendToTabs(request)).catch(console.error)
			break
		case "monster-response":
			browser.tabs.query({ "url": "*://*.dndbeyond.com/monsters/*"}).then(sendToTabs(request)).catch(console.error)
			break
		default:
			browser.tabs.query({ "url": "*://*./game" }).then(sendToTabs(request)).catch(console.error)
	}
})

function sendToTabs(message) {
	return (tabs) => {
		tabs.forEach(tab => {
			browser.tabs.sendMessage(tab.id, message).then(console.log).catch(console.error)
		});
	}
}	