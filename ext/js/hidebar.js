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
	"maxmsg" : 0,
	"fullscreenfix" : true,
	"expandstrm" : true
};

var settings = defaults;

function update() {
	if (window.location.pathname != "/") {
		if (settings["picartobar"] == true && !$(".emojiPicker").is(":visible")) {
			var s = $("#hideNotifications");
			if (s.parent().length != 0)
				s[0].click();
		}
		if (settings["fullscreenfix"] == true && !$(".vjs-menu-item").eq(5).hasClass("vjs-selected"))
			$(".vjs-menu-item").eq(5).click();
		if (settings["expandstrm"] == true) {
			$.each($('.vjs-menu-button.vjs-control.vjs-button'), function() {
				let e = $(this);
				if (!e.prev().hasClass("vjs-expand-button")) {
					addButtons(e);
					$('.vjs-expand-button').show();
					$('.vjs-collapse-button').hide();
				}
			});
		}
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
	
	if (!matches)
		return "";
	
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

function expand(name) {
	let parse = $(".fa-expand-alt");
	$.each(parse, function() {
		let e = $(this);
		if (e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
	$('.vjs-expand-button').hide();
	$('.vjs-collapse-button').show();
}
function collapse(name) {
	let parse = $(".fa-compress-alt");
	$.each(parse, function() {
		let e = $(this);
		if (e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
	$('.vjs-expand-button').show();
	$('.vjs-collapse-button').hide();
}
function hide(name) {
	let parse = $(".fa-times-square");
	$.each(parse, function() {
		let e = $(this);
		if (e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
}
function show(name) {
	let parse = $(".fa-plus-square");
	$.each(parse, function() {
		let e = $(this);
		if (e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
}

function addButtons(e) {
	let name = e.parents(".position-relative.animateAll").children().eq(0).attr("channel");
	e.before(
		$('<div/>', {'class': 'vjs-hide-button vjs-control vjs-button', 'title' : 'Hide'}).append(
			$('<button/>', {'class': 'vjs-hide-button vjs-menu-button-popup vjs-settings-button fa fa-times-square vjs-button'}).append(
				$('<span/>', {'class': 'vjs-control-text'}).text("Hide")
			)
		).on("click", function() {
			hide(name);
			event.stopPropagation();
		})
	).before(
		$('<div/>', {'class': 'vjs-collapse-button vjs-control vjs-button', 'title' : 'Collapse'}).append(
			$('<button/>', {'class': 'vjs-collapse-button vjs-menu-button-popup vjs-settings-button fa fa-compress-alt vjs-button'}).append(
				$('<span/>', {'class': 'vjs-control-text'}).text("Collapse")
			)
		).on("click", function() {
			collapse(name);
			event.stopPropagation();
		})
	).before(
		$('<div/>', {'class': 'vjs-expand-button vjs-control vjs-button', 'title' : 'Expand'}).append(
			$('<button/>', {'class': 'vjs-expand-button vjs-menu-button-popup vjs-settings-button fa fa-expand-alt vjs-button'}).append(
				$('<span/>', {'class': 'vjs-control-text'}).text("Expand")
			)
		).on("click", function() {
			expand(name);
			event.stopPropagation();
		})
	);
}

$(document).ready(() => {
	
	var styleTag = $('<style>.vjs-button { outline: none !important; cursor: pointer;}</style>');
	$('html > head').append(styleTag);;
	
	
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