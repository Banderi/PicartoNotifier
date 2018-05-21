if (chrome) {
	storage = chrome.storage;
	tabs = chrome.tabs;
	notifications = chrome.notifications;
	browser = chrome;
}
function isDevMode() {
    return !('update_url' in browser.runtime.getManifest());
}

var livecount = 0;
var invitecount = 0;
var ownname = "";
var exploreData = {};

var notloggedinrecall = false;

// download Picarto page to reload session
function loggedintest() {
	if (isDevMode()) {
		console.log("Pulling Picarto page...");
	}
	$.ajax({
		url: "https://picarto.tv/settings/multistream",
		success: function(data) {
			if (isDevMode()) {
				console.log("Yup, user is not logged in!");
			}
		},
		error: function() {
			console.log("Whoops. AJAX on Picarto failed!");
		}
	});
	notloggedinrecall = true;
}


function notify(name, type) {
	
	if (type == "live") {
		if (settings["notifications"] == true) {										
			browser.notifications.create(name, {
				type: "basic",
				iconUrl: "https://picarto.tv/user_data/usrimg/" + name.toLowerCase() + "/dsdefault.jpg",
				title: "Currently streaming on Picarto:",
				message: name
			}, function() {});
			if (settings["alert"] == true) {
				ding.play();
			}
		}
	}
}

function updateLive(callback) {
	
	livecount = 0;
	let cleanData = {};
	
	// fetch from storage and update cache
	storage.local.get("LIVE", function(items) {
		
		let livecache = items["LIVE"];
	
		// loop through cached users to update for removal
		for (u in livecache) {
			
			let name = u; // saved with key rather than index
			let user = livecache[u]; // the actual stored object
			
			user["live"] = false;
			
			// compare with newly pulled data
			for (i in exploreData) {
				
				// got a match! cache will be updated and name will be remembered
				if (name === exploreData[i].channel_name) {
					
					exploreData[i]["old"] = true;
					user["live"] = true;
					
					/* continue; */
				}
			}
			
			// user no longer online
			if (!user["live"]) {
				
				// remove user from cache
				delete livecache[u]
				if (isDevMode()) {
					console.log("User '" + name + "' no longer online (removed from cache)");
				}
			}
		}
		
		// add the remaining users and dispatch notifications
		for (i in exploreData) {
			
			let name = exploreData[i].channel_name;
			let user = exploreData[i];
			
			cleanData[name] = user;
			
			// new user online
			if (!user["old"]) {
				if (isDevMode()) {
					console.log(name + " just started streaming!");
				}
				
				// dispatch live notification (or not)
				notify(name, "live");
			}
		}
		
		livecount = Object.keys(cleanData).length;
		
		browser.storage.local.set({"LIVE" : cleanData}, function() {
			typeof callback === 'function' && callback();
		});	
	});
}

function updateNotifications(callback) {
	
	
	typeof callback === 'function' && callback();
}

function updateBadge(callback) {
	
	browser.browserAction.setBadgeBackgroundColor( { color: settings["badgecolor"]} );
			
	// update badge text			
	var badgetext = "";
	var badgetooltip = "";
	
	
	// fetch multistream invites
	if (settings["streamer"] == true) {
		
		//invitecount = parse.length;
		/* if (isDevMode()) {
			console.log("Live: " + livecount);
			console.log("Invites: " + invitecount);
		} */
		if (livecount == 1) {
			badgetext = "1";
			badgetooltip = "1 person streaming";
		} else if (livecount > 1) {
			badgetext = livecount.toString();
			badgetooltip = livecount.toString() + " people streaming";
		} else {
			badgetext = "";
			badgetooltip = "";
		}
		if (livecount > 0) {
			if (invitecount == 1) {
				badgetext = badgetext + ", 1";
				badgetooltip = badgetooltip + ", 1 invite";
			} else if (invitecount > 1) {
				badgetext = badgetext + ", " + invitecount.toString();
				badgetooltip = badgetooltip + ", " + invitecount.toString() + " invites";
			}
		}
		else {
			if (invitecount == 1) {
				badgetext = "1";
				badgetooltip = "1 invite";
			} else if (invitecount > 1) {
				badgetext = invitecount.toString();
				badgetooltip = invitecount.toString() + " invites";
			}
		}
		browser.browserAction.setBadgeText({"text": badgetext});
		browser.browserAction.setTitle({"title": badgetooltip});
		
		// get profile/dashboard settings from storage or pull from the website
		if (ownname) {
			var url = "https://api.picarto.tv/v1/channel/name/" + ownname;
			$.ajax({
				url: url,
				success: function(data) {
					if (isDevMode()) {
						console.log("Fetching dashboard data...");
					}
					var obj = data;
					
					var gamingmode = obj["gaming"];
					var nsfw = obj["adult"];
					var commissions = obj["commissions"];
					account = obj["account_type"];
					
					if (isDevMode()) {
						console.log(gamingmode);
						console.log(nsfw);
						console.log(commissions);
						console.log(account);
					}
					
					var dashboard = {};
					
					dashboard["gamingmode"] = gamingmode;
					dashboard["nsfw"] = nsfw;
					dashboard["commissions"] = commissions;
					
					storage.local.get("SETTINGS", function(items) {
						if (items["SETTINGS"]) {
							settings = items["SETTINGS"];
						} else if (localStorage["SETTINGS"]) {
							settings = JSON.parse(localStorage["SETTINGS"]); // get backup data from localStorage
						}
						settings["dashboard"] = dashboard;
						settings["account"] = account;
						browser.storage.local.set({"SETTINGS" : settings}, function() {
							localStorage["SETTINGS"] = JSON.stringify(settings); // save backup data in localStorage
						});
					});
				}
			});
		}
	}
	else {
		/* if (isDevMode()) {
			console.log("Live: " + livecount);
		} */				
		if (livecount == 1) {
			badgetext = "1";
			badgetooltip = "1 person streaming";
		} else if (livecount > 1) {
			badgetext = livecount.toString();
			badgetooltip = livecount.toString() + " people streaming";
		} else {
			badgetext = "";
			badgetooltip = "";
		}
		browser.browserAction.setBadgeText({"text": badgetext});
		browser.browserAction.setTitle({"title": badgetooltip});
	}
	
	typeof callback === 'function' && callback();
}

// main update function
function update() {
	$.post("https://picarto.tv/process/explore", {follows: true}).done(function(data) {
		exploreData = JSON.parse(data);
		
		if (isDevMode()) {
			console.log("Updating...");
		}
		
		// check user session
		if (exploreData[0] && exploreData[0].error == "notLoggedin") {
			if (isDevMode()) {
				console.log("User is not logged in!");
			}
			if (notloggedinrecall == false) {
				loggedintest();
			}
			else {
				storage.local.clear();
				storage.local.set({"USERNAME" : false});
			}
		}
		else {
			notloggedinrecall = false;
			storage.local.set({"USERNAME" : ""});
			updateLive(()=>{
				updateNotifications(()=>{
					updateBadge(()=>{
						if (isDevMode()) {
							console.log("Update done!");
						}
					})
				})
			})
		}
	});
}

// get default settings or fetch from storage
let defaults = {
	"refresh" : 300000,
	"picartobar" : true,
	"notifications" : true,
	"alert" : false,
	"streamer" : false,
	"badgecolor" : "#33aa33"
};

var settings = defaults;
var updater;

storage.local.get(["SETTINGS"], (data) => {
	for (let a in data["SETTINGS"]) {
		let setting = data["SETTINGS"][a];
		settings[a] = setting;
	}
	
	// start the update!
	update();
	updater = setInterval(update, 5000);
})

// create audio alert object
var ding = new Audio('audio/ding.ogg');

// add listener to the desktop notification popups
browser.notifications.onClicked.addListener(function(notificationId) {
	if (isDevMode()) {
		console.log("Notification clicked! ID: " + notificationId);
	}
	window.open('https://picarto.tv/' + notificationId, '_blank');
	browser.notifications.clear(notificationId, function() {});
});

// listen for messages from other pages
browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch (request.message) {
		case "setCount":
			setCount(request.count);
			break
		case "settingChanged":
			if (isDevMode()) {
				console.log("New settings - update: " + request.refresh);
			}
			settings["notifications"] = request.notifications;
			settings["alert"] = request.alert;
			settings["streamer"] = request.streamer;
			break
		case "updateAll":
			break
		case "getFullStorage":
			if (isDevMode()) {
				console.log("getFullStorage");
			}
			storage.local.get(null, function(items) {
				sendResponse(items);
			});
			return true;
		case "getBadgeText":
			if (isDevMode()) {
				console.log("getBadgeText");
			}
			browser.browserAction.getBadgeText({}, function(result) {
				sendResponse(result);
			});
			return true;
		}
		return false;
	}
);