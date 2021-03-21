let className = document.querySelector("nav.b-breadcrumb ul").lastElementChild.innerText.trim()

let header = document.querySelector("div.page-header__extra div.more-links div.more-links__links")
if (!document.getElementById("paradox_import_start")) {
	let button = document.createElement("a")
	let span = document.createElement("span")
	let textNode = document.createTextNode("import")
	button.appendChild(span)
	span.appendChild(textNode)
	button.id = "paradox_import_start"
	button.classList.add("button-alt")

	header.prepend(button)
}

document.getElementById("paradox_import_start").onclick = async () => {
	let container = document.querySelector("div.content-container div.content-container")
	let fs = []
	let current = []
	for (let i = 0; i < container.children.length; i++) {
		if (container.childNodes[i].nodeName === "H4") {
			if (current.length >= 0) {
				fs.push(current)
				console.log(current)
			}
			current = []
		}
		current.push(container.children[i].innerHTML)
	}

	console.log(fs)
}

console.log(className)