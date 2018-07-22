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
	"expandstrm" : true,
	"norefer" : true
};

var settings = defaults;

function update() {
	if (window.location.pathname != "/") {
		if (settings["picartobar"] == true && !$(".emojiPicker").is(":visible")) {
			var s = $("#hideNotifications");
			if (s.parent().length != 0)
				s[0].click();
		}
		if (settings["fullscreenfix"] == true) {
			$(".vjs-menu.vjs-settings-menu").each(function(){
				$(this).children().eq(2).find(".vjs-menu-item").each(function(){
					let e = $(this);
					if (e.find("span").eq(0).text() == "HLS" && !e.hasClass("vjs-selected"))
						e.click();
				});
			});
		}
		if (settings["expandstrm"] == true) {
			if ($(".userbar-multistream-hover-target").children().length < 2)
				return;
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

/* linkfix(str) {	
	return decodeURIComponent(str.replace("https://picarto.tv/site/referrer?go=", "").replace(/\&amp\;ref\=(.+?)\" target\=\"\_blank\"/g, '" target="_blank"'));
} */

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function expand(name) {
	let parse = $(".fa-expand-alt");
	$.each(parse, function() {
		let e = $(this);
		if (e.parent().parent().attr("name") && e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
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
		if (e.parent().parent().attr("name") && e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
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
		if (e.parent().parent().attr("name") && e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
			e.click();
			return false;
		}
	});
}
function show(name) {
	let parse = $(".fa-plus-square");
	$.each(parse, function() {
		let e = $(this);
		if (e.parent().parent().attr("name") && e.parent().parent().attr("name").toLowerCase() === name.toLowerCase()) {
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

/* function postEmoji(alt) {
	let chat = $("#msg")[0];
	var shift = chat.selectionStart + alt.length;
	chat.value = chat.value.substring(0, chat.selectionStart) + alt + chat.value.substring(chat.selectionEnd);
	chat.selectionStart = chat.selectionEnd = shift;
    chat.focus();
} */

$(document).ready(() => {
	
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
	
	storage.sync.get("SETTINGS", (data) => {
		for (let a in data["SETTINGS"]) {
			let setting = data["SETTINGS"][a];
			settings[a] = setting;
		}
		
		/* if (settings["quickemotes"]) {
			$("#chat_extras_btn").parent().append($('<div/>', {'class': 'pnt_quick_emotes', 'id' : 'pnt_quick_emotes'}));
		} */
		
		let targetNode = document.getElementById("chatContainer");
		let options = {childList: true, subtree: true};
		let observer = new MutationObserver((mutationList) => {
			if (settings["markup"] == true || settings["norefer"] == true) {
				let msgs = document.getElementsByClassName("theMsg");
				for (let a = msgs.length-1; a >= 0; a--) {
					let m = msgs[a];
					
					if (!m.classList.contains("MarkUp") && settings["markup"] == true) {
						m.classList.add("MarkUp");
						m.innerHTML = markup(m.innerHTML);
					}
					if (!m.classList.contains("LinkFix") && settings["norefer"] == true) {
						m.classList.add("LinkFix");
						
						/* let lf = m.innerHTML.match(/href(.+?)\" target\=\"\_blank\"/g)[0];
						lf = lf.replace('href="', '');
						lf = lf.replace('" target="_blank"', ''); */
						
						m.innerHTML
						
						m.innerHTML = decodeURIComponent(m.innerHTML.replace(/https\:\/\/picarto\.tv\/site\/referrer\?go\=/g, "").replace(/\&amp\;ref\=(.+?)\" target\=\"\_blank\"/g, '" target="_blank"'));
						
						//m.innerHTML = m.innerHTML.replace(lf, linkfix(lf));
					}
				}
			}
			
			let msgc = $("#msgs li");
			let msgu = msgc.not("[class]");
			
			while (msgu.length > 1) {
				msgu[0].remove();
				msgc = $("#msgs li");
				msgu = msgc.not("[class]");
			}
			
			if (settings["maxmsg"] && parseInt(settings["maxmsg"]) > 0) {
				while (msgc.length > settings["maxmsg"]) {
					msgc[0].remove();
					msgc = $("#msgs li");
				}
			}
		});
		observer.observe(targetNode, options);
		
		/* if(settings["cleantab"] == true) */
		targetNode = document.querySelector('head > title');
		options = {subtree: true, characterData: true, childList: true};
		let observer2 = new MutationObserver((mutationList) => {
			if (document.title.includes("[LIVE]")) {
				document.title = document.title.replace("[LIVE]", "");
				document.title = document.title.replace("- Picarto", " (\u25B6) - Picarto");
			}
		});
		observer2.observe(targetNode, options);
	});
});