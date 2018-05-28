if (chrome) {
	storage = chrome.storage;
	tabs = chrome.tabs;
	notifications = chrome.notifications;
	browser = chrome;
}
function isDevMode() {
    return !('update_url' in browser.runtime.getManifest());
}

// get default settings or fetch from storage
let defaults = {
	"picartobar" : false,
	"markup" : true,
	"maxmsg" : 0
};

var settings = defaults;

function update() {
	if (settings["picartobar"] == true && !$(".emojiPicker").is(":visible")) {
		var s = $("#hideNotifications");
		if (s.parent().length != 0)
			s[0].click();
	}
}

update();
var updater = setInterval(update, 1000);

////

var star = /\*(\S(.*?\S)?)\*/gm;
var double_star = /\*\*(\S(.*?\S)?)\*\*/gm;
var undersc = /\_(\S(.*?\S)?)\_/gm;
var double_undersc = /\_\_(\S(.*?\S)?)\_\_/gm;
var tilde = /\~(\S(.*?\S)?)\~/gm;
var double_tilde = /\~\~(\S(.*?\S)?)\~\~/gm;

function markup(str) {
	
	let matches = ("i>" + str).match(/[a|i|"|n]>(.*?)(?=<)/gm);
	let nonmatches = str.match(/<(.*?)(?=[a|i|"|n]>)/gm);
	
	matches[0] = matches[0].substring(2);

	let newstring = "";

	for (i = 0; i < matches.length; i++) {
        if( !(i+1<matches.length && matches[i+1].startsWith("a")) ) {
            matches[i] = matches[i].replace(double_star, '<b>$1</b>');
            matches[i] = matches[i].replace(double_undersc, '<u>$1</u>');
            matches[i] = matches[i].replace(star, '<i>$1</i>');
            matches[i] = matches[i].replace(undersc, '<i>$1</i>');
            matches[i] = matches[i].replace(double_tilde, '<s>$1</s>');
        }
        newstring = newstring + matches[i] + nonmatches[i];
	}

    newstring += "n>";
    return newstring;
}

$(document).ready(() => {
	storage.sync.get("SETTINGS", (data) => {	
		for (let a in data["SETTINGS"]) {
			let setting = data["SETTINGS"][a];
			settings[a] = setting;
		}
		
		if (settings["markup"] == true || (settings["maxmsg"] && parseInt(settings["maxmsg"]) > 0)) {
			let targetNode = document.getElementById("chatContainer");
			let options = {childList:true,subtree:true};
			let observer = new MutationObserver((mutationList)=>{
				if (settings["markup"] == true) {
					let msgs = document.getElementsByClassName("theMsg");
					for(let a = msgs.length-1; a >= 0; a--){
						let m = msgs[a];
						if(!m.classList.contains("MarkUp")){
							m.classList.add("MarkUp");
							m.innerHTML = markup(m.innerHTML);
						}
					}
				}
				if (settings["maxmsg"] && parseInt(settings["maxmsg"]) > 0) {
					let msgc = document.querySelectorAll('#msgs li');
					while (msgc.length > settings["maxmsg"]) {
						msgc[0].remove();
						msgc = document.querySelectorAll('#msgs li');
					}
				}
			});
			observer.observe(targetNode, options);
		}
	});
});