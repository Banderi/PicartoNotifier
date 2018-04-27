if (chrome) {
	storage = chrome.storage;
}

function isDevMode() {
    return !('update_url' in chrome.runtime.getManifest());
}

function injectCSS(style) {
	let css = document.createElement('style');
	css.textContent = style;
	document.head.appendChild(css);
}

// get setting from storage
storage.local.get("SETTINGS", (item) => {
	// hide Picarto official notification bar via css injection
	// if picartobar is undefined, default to false
	// TODO requires reload of page if setting changed
	let picartobar = item["SETTINGS"]["picartobar"];	
	if (picartobar){
		if(isDevMode()){
			console.log("Hiding official Picarto bar")
		}
		injectCSS(".notificationMenu{display: none !important;}");
	}
});




