if (chrome) {
	storage = chrome.storage;
	tabs = chrome.tabs;
	notifications = chrome.notifications;
	browser = chrome;
}
function isDevMode() {
    return !('update_url' in browser.runtime.getManifest());
}

// css injector
function css(selector, property, value) {
    for (var i=0; i<document.styleSheets.length;i++) {
        try { document.styleSheets[i].insertRule(selector+ ' {'+property+':'+value+'}', document.styleSheets[i].cssRules.length);
        } catch(err) {try { document.styleSheets[i].addRule(selector, property+':'+value);} catch(err) {}} // IE
    }
}
function injectCSS(style) {
	/* var css = document.createElement('style');
	css.type = "text/css";
	css.textContent = style;
	(document.head||document.documentElement).appendChild(css);
	$("head").append(css);
	css.remove(); */
	let css = document.createElement('style');
	css.textContent = style;
	document.head.appendChild(css);
}

// script injection function - NOTE: this can be used ONLY for disabling inline scripts
function injectScript(func) {
	var actualCode = '(' + func + ')();'
	var script = document.createElement('script');
	script.textContent = actualCode;
	(document.head||document.documentElement).appendChild(script);
	$("head").append(script);
	script.remove();
}

// get setting from storage
var picartobar = true;
storage.local.get("SETTINGS", (item) => {
	// hide Picarto official notification bar via css/script injection
	// if picartobar is undefined, default to false
	// TODO requires reload of page if setting changed
	let picartobar = item["SETTINGS"]["picartobar"];
	if (picartobar == true)
	{
		if (isDevMode()) {
			console.log("Hiding official Picarto bar");
		}
		injectScript(function() {
			initNotifications = function() {
				//
			}
		});
		/* css(".notificationMenu", "display", "none !important"); */
		injectCSS(".notificationMenu{display: none !important;}");
	}
});