if (chrome) {
	extension = chrome.extension;
	storage = chrome.storage;
	browser = chrome;
}

// save settings to local storage
function save_options() {
	var select;
	var settings = {};
	
	select = document.getElementById("updateTime");
	var updateTime = select.children[select.selectedIndex].value;
	
	select = document.getElementById("picartobar");
	var picartobar = select.checked.toString();
	
	select = document.getElementById("notifications");
	var notifications = select.checked.toString();
	
	select = document.getElementById("alert");
	var alert = select.checked.toString();
	
	select = document.getElementById("streamer");
	var streamer = select.checked.toString();
	
	
	storage.local.get("SETTINGS", function(items) {
		if (items["SETTINGS"]) {
			settings = items["SETTINGS"];
		} else if (localStorage["SETTINGS"]) {
			settings = JSON.parse(localStorage["SETTINGS"]); // get backup data from localStorage
		}
		settings["update"] = updateTime;
		settings["picartobar"] = picartobar;
		settings["notifications"] = notifications;
		settings["alert"] = alert;
		settings["streamer"] = streamer;
		browser.storage.local.set({"SETTINGS" : settings}, function() {
			localStorage["SETTINGS"] = JSON.stringify(settings); // save backup data in localStorage
			var status = document.getElementById("status");
			status.textContent = "Options Saved.";
			setTimeout(function() {
				status.textContent = "";
			}, 750);
			browser.runtime.sendMessage( {message: "settingChanged", update: updateTime, notifications: notifications, alert: alert, streamer: streamer} );
		});
	});
}

function purgeoptions() {
	localStorage.clear();
	
	browser.storage.local.clear(function() {
		var status = document.getElementById("purgestatus");
		var error = browser.runtime.lastError;		
		if (error) {
			status.textContent = error;
		}
		else {
			status.textContent = "Settings storage cleared!";
			
			var select = document.getElementById("updateTime");
			for (var i = 0; i < select.children.length; i++) {
				var child = select.children[i];
				if (child.value == "300000") {
					child.selected = "true";
					break;
				}
			}
			
			select = document.getElementById("picartobar");
			select.checked = true;
			
			select = document.getElementById("notifications");
			select.checked = true;
			select.onchange = refresh;
			
			select = document.getElementById("alert");
			select.checked = false;
			select.disabled = false;
			
			select = document.getElementById("streamer");
			select.checked = false;
			
		}
		setTimeout(function() {
			status.textContent = "";
		}, 750);
		browser.runtime.sendMessage( {message: "settingChanged", update: "300000", notifications: "true", alert: "false", streamer: "false"} );
	});
}

// update text and buttons
function page_load() {
	var save = document.getElementById("save");
	save.onclick = save_options;
	purge.onclick = purgeoptions;
	
	// fetch saved settings or generate default ones
	var settings = {};				// g
	var updateTime = "300000";		// s
	var notifications = "true";		// s
	var alert = "false";			// s
	var streamer = "false";			// s
	var picartobar = "true";		// s

	storage.local.get("SETTINGS", function(items) {
		if (items["SETTINGS"]) {
			settings = items["SETTINGS"];
		} else if (localStorage["SETTINGS"]) {
			settings = JSON.parse(localStorage["SETTINGS"]); // get backup data from localStorage
		}
		
		if (settings) {
			if (settings["update"]) {
				updateTime = settings["update"];
			}
			if (settings["notifications"]) {
				notifications = settings["notifications"];
			}
			if (settings["alert"]) {
				alert = settings["alert"];
			}
			if (settings["streamer"]) {
				streamer = settings["streamer"];
			}
			if (settings["picartobar"]) {
				picartobar = settings["picartobar"];
			}
		}
		
		var select = document.getElementById("updateTime");
		for (var i = 0; i < select.children.length; i++) {
			var child = select.children[i];
			if (child.value == updateTime) {
				child.selected = "true";
				break;
			}
		}
		
		select = document.getElementById("picartobar");
		select.checked = (picartobar == "true");
		
		select = document.getElementById("notifications");
		select.checked = (notifications == "true");
		select.onchange = refresh;
		
		select = document.getElementById("alert");
		select.checked = (alert == "true");
		select.disabled = !(notifications == "true");
		
		select = document.getElementById("streamer");
		select.checked = (streamer == "true");
	});
}

// refresh some content after linked settings changed
function refresh() {
	select = document.getElementById("alert");
	select.disabled = !document.getElementById("notifications").checked;
}

window.onload = page_load;