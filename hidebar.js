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
	var css = document.createElement('style');
	css.type = "text/css";
	css.textContent = style;
	(document.head||document.documentElement).appendChild(css);
	$("head").append(css);
	css.remove();
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
var picartobar = "true";
injectCSS(".notificationMenu { visibility: hidden; }");
css(".notificationMenu", "visibility", "hidden");
chrome.storage.local.get("SETTINGS", function(items) {
	picartobar = items["SETTINGS"]["picartobar"];
	if (isDevMode()) {
		console.log("picartobar: " + picartobar);
	}
	
	// hide Picarto official notification bar via inline script injection (i.e. redefine "initNotifications(...)")
	if (picartobar == "true")
	{
		if (isDevMode()) {
			console.log("Hiding official Picarto bar");
		}
		injectScript(function() {
			initNotifications = function() {
				//
			}
		});
		css(".notificationMenu", "visibility", "hidden");
	} else {
		css(".notificationMenu", "visibility", "visible");
	}
});