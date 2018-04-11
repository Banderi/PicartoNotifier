/*
javascript for options page. settings defaults are actually stored in global.js
this just handles the options.html interface with the local storage
*/
let messageTimer = 3000

let defaults = {
	"update":300000,
	"picartobar":true,
	"notifications":true,
	"alert":false,
	"streamer":false
}

let elems = {};

let saveStatusElem = null;
let purgeStatusElem = null;

// sets a temporary text content message for the specified elem
function setMessage (elem, text) {
	elem.textContent = text
	setTimeout(() => {elem.textContent = ""}, messageTimer)
}

// sends update to browser runtime for this extension
function sendUpdate (data) {
	let msg = {"message":"settingChanged"}
	for(let a in data){
		msg[a] = data
	}
	chrome.runtime.sendMessage(data);
}

// returns true if no errors on accessing storage
// otherwise returns false
// also sets temporary status message
function testNoStorageErrors(statusElem, successMsg){
	let err = chrome.runtime.lastError
	if(err){
		setMessage(statusElem, err)
		return false;
	}
	setMessage(statusElem, successMsg)
	return true;
}

// sets html elements based on data input
function setElements(data){
	for(let a in data){
		if(a in elems){
			let elem = elems[a]
			if(elem.type === "checkbox"){
				elem.checked = data[a]
			}else{
				elem.value = data[a]
			}
		}
	}
}

// save settings to local storage
function saveOptions() {
	let settings = {};
	for(let a in elems){
		let elem = elems[a]
		if(elem.type === "checkbox"){
			settings[a] = elem.checked
		}else{
			settings[a] = elem.value
		}
	}
	chrome.storage.local.set({"SETTINGS":settings}, () => {
		if(testNoStorageErrors(saveStatusElem, "Options saved.")){
			sendUpdate(settings)
		}
	})
}

function purgeOptions() {
	chrome.storage.local.clear(() => {
		if(testNoStorageErrors(purgeStatusElem, "Settings storage cleared!")){
			setElements(defaults)
			sendUpdate(defaults)
		}
	})
}

// update text and buttons
window.onload = ()=>{
	saveStatusElem = document.getElementById("status")
	purgeStatusElem = document.getElementById("purgestatus")

	let settings = {} // used for initial setting of elements later
	for (let a in defaults){
		elems[a] = document.getElementById(a);
		settings[a] = defaults[a]
	}

	document.getElementById("save").addEventListener('click', saveOptions)
	document.getElementById("purge").addEventListener('click', purgeOptions)

	chrome.storage.local.get(["SETTINGS"], (data)=>{
		for(let a in defaults){
			if(a in data["SETTINGS"]){
				let setting = data["SETTINGS"][a]
				if(typeof setting === "string"){
					if(setting == "true"){
						setting = true
					}else if(setting == "false"){
						setting = false
					}else{
						let num = parseInt(setting)
						if(!isNaN(num)){
							setting = num
						}
					}
				}
				settings[a] = setting
			}
		}
		setElements(settings)
	})
}


