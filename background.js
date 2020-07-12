browser.runtime.onMessage.addListener((request, sender, respond) => {
	console.log("received: ", sender, request)
	respond("kthxbye")
	browser.tabs.query({"url": "*://*./game"}).then(sendToFoundryTab(request)).catch(console.error)
})

function sendToFoundryTab(message) {
	return (tabs) => {
		browser.tabs.sendMessage(tabs[0].id, message).then(console.log).catch(console.error)
	}
}