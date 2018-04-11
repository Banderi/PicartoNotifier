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

// sets a temporary text content message for the specified elem
function set_message (elem, text) {
	elem.textContent = text
	setTimeout(() => {elem.textContent = ""}, messageTimer)
}

// sends update to browser runtime for this extension
// edits the data packet with 'message' so you may need to make a copy before
// calling this
function send_update (data) {
	data["message"] = "settingChanged"
	chrome.runtime.sendMessage(data);
}

// returns true if no errors on accessing storage
// otherwise returns false
// also sets temporary status message
function test_no_storage_err(statusElem, successMsg){
	let err = chrome.runtime.lastError
	if(err){
		set_message(statusElem, err)
		return false;
	}
	set_message(statusElem, successMsg)
	return true;
}

// sets html elements based on data input
function set_elements(data){
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
function save_options() {
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
		if(test_no_storage_err(saveStatusElem, "Options saved.")){
			let data = {}
			for(a in settings){data[a] = settings[a];}
			send_update(data)
		}
	})
}

function purgeoptions() {
	chrome.storage.local.clear(() => {
		if(test_no_storage_err(saveStatusElem, "Settings storage cleared!")){
			set_elements(defaults)

			let data = {}
			for(a in defaults){data[a] = defaults[a];}
			send_update(data)
		}
	})
}

// update text and buttons
window.onload = ()=>{
	saveStatusElem = document.getElementById("status")

	for (let a in defaults){
		elems[a] = document.getElementById(a);
	}
	
	document.getElementById("save").addEventListener('click', save_options)
	document.getElementById("purge").addEventListener('click', purgeoptions)

	chrome.storage.local.get(defaults, (data)=>{
		set_elements(data)
	})
}


