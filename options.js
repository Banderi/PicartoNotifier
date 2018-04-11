/*
javascript for options page. settings defaults are actually stored in global.js
this just handles the options.html interface with the local storage
*/
let messageTimer = 3000

let defaults = {
	"updateTime":300000,
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
// edits the data packet with 'message' so you may need to make a copy before
// calling this
function sendUpdate (data) {
	data["message"] = "settingChanged"
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
		if(a in Object.keys(elems)){
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
			let data = {}
			for(a in settings){data[a] = settings[a];}
			sendUpdate(data)
		}
	})
}

function purgeOptions() {
	chrome.storage.local.clear(() => {
		if(testNoStorageErrors(saveStatusElem, "Settings storage cleared!")){
			setElements(defaults)

			let data = {}
			for(a in defaults){data[a] = defaults[a];}
			sendUpdate(data)
		}
	})
}

// update text and buttons
window.onload = ()=>{
	saveStatusElem = document.getElementById("status")
	purgeStatusElem = document.getElementById("purgestatus")

	for (let a in defaults){
		elems[a] = document.getElementById(a);
	}

	document.getElementById("save").addEventListener('click', saveOptions)
	document.getElementById("purge").addEventListener('click', purgeOptions)

	chrome.storage.local.get(defaults, (data)=>{
		setElements(data)
	})
}


