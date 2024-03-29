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
let defaults = {};
var settings = {};
function initSettings(callback) {
	const url = browser.runtime.getURL('defaults.json');
	fetch(url)
		.then(e => e.json())
		.then(j =>
	{
		defaults = j;
		settings = {
			...defaults
		};
		callback();
	});
}

var tabID = null;
browser.runtime.sendMessage({ message: "tabID" }, t => {
   tabID = t["tab"];
   console.log('My tabId is', tabID);
});

async function update() {
	
	/* console.log("Updating...."); */
	
	/* console.log(localStorage["auth"]); */
	/* storage.local.get(null, (data) => {
		console.log(data);
	}); */
	
	await storage.sync.set({"OAUTH" : JSON.parse(localStorage["auth"])["access_token"]});
	/* console.log(localStorage);
	console.log(JSON.parse(localStorage["auth"]));
	console.log(JSON.parse(localStorage["auth"])["access_token"]); */
	/* storage.sync.get("OAUTH", (data) => {
		console.log(data["OAUTH"]);
	});
	storage.sync.get("SETTINGS", (data) => {
		console.log(data["SETTINGS"]);
	}); */
	
	if (window.location.pathname != "/") {
		if (settings.picartobar && !$(".emojiPicker").is(":visible")) {
			/* var s = $("#hideNotifications");
			if (s.parent().length != 0)
				s[0].click(); */
			$("[title='Mark all as read']").click();
		}
		if (settings.fullscreenfix && false) {
			$(".vjs-menu.vjs-settings-menu").each(function(){
				$(this).children().eq(2).find(".vjs-menu-item").each(function(){
					let e = $(this);
					if (e.find("span").eq(0).text() == "HLS" && !e.hasClass("vjs-selected"))
						e.click();
				});
			});
		}
		if (settings.expandstrm && false) {
			if ($('[class*="StreamVideoContainer"]').children().length < 2)
				return;
			$.each($('.mistvideo-custom-controls.settingsIcon'), function() {
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

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function buttParentName(e) {
	/* return e.parent().parent().find("img").attr("alt"); */
	return e.parent().parent().find('span').text();
}

function expand(name) {
	let parse = $(".fa-expand-alt");
	$.each(parse, function() {
		let e = $(this);
		let n = buttParentName(e);
		if (n && n.toLowerCase() === name.toLowerCase()) {
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
		let n = buttParentName(e);
		if (n && n.toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
	$('.vjs-expand-button').show();
	$('.vjs-collapse-button').hide();
}
function hide(name) {
	let parse = $('i[title="Expand"]');
	$.each(parse, function() {
		let e = $(this);
		let n = buttParentName(e);
		if (n && n.toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
}
function show(name) {
	let parse = $(".fa-plus-square");
	$.each(parse, function() {
		let e = $(this);
		let n = buttParentName(e);
		if (n && n.toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
}

function addButtons(e) {
	let name = e.parents(".position-relative.animateAll").children().closest("picarto-player").attr("channel");
	e.before(
		$('<div/>', {'class': 'vjs-hide-button vjs-control vjs-button', 'title' : 'Hide'}).append(
			$('<button/>', {'class': 'vjs-hide-button vjs-menu-button vjs-menu-button-popup vjs-settings-button fa fa-times-square vjs-button'}).append(
				$('<span/>', {'class': 'vjs-control-text'}).text("Hide")
			)
		).on("click", function() {
			hide(name);
			event.stopPropagation();
		})
	).before(
		$('<div/>', {'class': 'vjs-collapse-button vjs-control vjs-button', 'title' : 'Collapse'}).append(
			$('<button/>', {'class': 'vjs-collapse-button vjs-menu-button vjs-menu-button-popup vjs-settings-button fa fa-compress-alt vjs-button'}).append(
				$('<span/>', {'class': 'vjs-control-text'}).text("Collapse")
			)
		).on("click", function() {
			collapse(name);
			event.stopPropagation();
		})
	).before(
		$('<div/>', {'class': 'vjs-expand-button vjs-control vjs-button', 'title' : 'Expand'}).append(
			$('<button/>', {'class': 'vjs-expand-button vjs-menu-button vjs-menu-button-popup vjs-settings-button fa fa-expand-alt vjs-button'}).append(
				$('<span/>', {'class': 'vjs-control-text'}).text("Expand")
			)
		).on("click", function() {
			expand(name);
			event.stopPropagation();
		})
	);
}

/* function postEmoji(alt) {
	let chat = $("#msg")[0];
	var shift = chat.selectionStart + alt.length;
	chat.value = chat.value.substring(0, chat.selectionStart) + alt + chat.value.substring(chat.selectionEnd);
	chat.selectionStart = chat.selectionEnd = shift;
    chat.focus();
} */

var try_interval = null;
var targetNode = null;

function observe(target) {
	var styleTag = $(`
			<style>
			.vjs-button {
				outline: none !important;
				cursor: pointer;
			}
			.pnt_quick_emotes {
				position: absolute;
				background: black;
				width: 40px;
				height: 100px;
				bottom: 40px;
			}
			</style>
		`);
	$('html > head').append(styleTag);
	
	/* console.log("Getting settings...") */
	storage.sync.get("SETTINGS", async (data) => {
		console.log("Settings loaded!!")
		for (let a in data["SETTINGS"]) {
			let setting = data["SETTINGS"][a];
			settings[a] = setting;
		}
		
		if (settings.csstweaks) (async function(){
			let res = await fetch('https://raw.githubusercontent.com/Banderi/PicartoNotifier/master/csstweaks.css');
			let body = await res.text();
			
			var style = document.createElement("style");
			style.innerHTML = body;
			document.getElementsByTagName("head")[0].appendChild(style);
		}) ();
		
		// broken.......
		/* if (settings.chatslider) {
			$(".styled__PopoutChatBoxContainer-sc-1y6xjog-1").children().eq(0).append("<iframe src='https://picarto.tv/chatpopout/Banderi/public' />")
		} */
		
		
		targetNode = target;
		let options = {childList: true, subtree: true};
		let observer = new MutationObserver((mutationList) => {
			if (settings.markup || settings.norefer) {
				let msgs = document.querySelectorAll('[class*="Message__StyledSpan"]');
				for (let a = msgs.length-1; a >= 0; a--) { // a is index, msgs is primary message span list, m is the immediate parent/span container
					let m = msgs[a].parentElement;
					
					if (!m.classList.contains("MarkUp") && settings.markup & false) {
						setTimeout(function() {
							m.classList.add("MarkUp");
							m.innerHTML = markup(m.innerHTML);
						}, 1);
					}
					if (!m.classList.contains("LinkFix") && settings.norefer) {
						setTimeout(function() {
							m.classList.add("LinkFix");
							
							/* let lf = m.innerHTML.match(/href(.+?)\" target\=\"\_blank\"/g)[0];
							lf = lf.replace('href="', '');
							lf = lf.replace('" target="_blank"', ''); */
							
							m.innerHTML = decodeURIComponent(m.innerHTML.replace('href="/site/referrer?go=', 'href="').replace(/\&amp\;ref\=(.+?)\" target\=\"\_blank\"/g, '" target="_blank"'));
							
							/* m.innerHTML = m.innerHTML; */
							
							/* m.innerHTML = decodeURIComponent(m.innerHTML.replace(/https\:\/\/picarto\.tv\/site\/referrer\?go\=/g, "").replace(/\&amp\;ref\=(.+?)\" target\=\"\_blank\"/g, '" target="_blank"')); */
							//m.innerHTML = m.innerHTML.replace(lf, linkfix(lf));
						}, 1);
					}
				}
			}
			
			let msgc = $(document.querySelectorAll('[class*="MessageContainer"]')); // message containers
			let msgu = msgc.not("[class]");
			
			while (msgu.length > 1) { // remove duplicate error/warnings/psa messages in chat
				msgu[0].remove();
				msgc = $("#msgs").children();
				msgu = msgc.not("[class]");
			}
			
			if (settings.maxmsg && parseInt(settings.maxmsg) > 0) {
				while (msgc.length > parseInt(settings.maxmsg)) {
					msgc[0].remove();
					msgc = $(document.querySelectorAll('[class*="MessageContainer"]'));
				}
			}
		});
		if (isDevMode())
			console.log(targetNode);
		observer.observe(targetNode, options);
	});
}

function startup() {
	let element = document.querySelectorAll('[class*="ChannelChat__ChatVirtualList"]');
	
	if (element && element.length >= 1) {
		observe(element[0]);
	} else
		setTimeout(startup, 500);
}

$(document).ready(() => {
	console.log("Starting up...");
	
	initSettings(startup);
});
