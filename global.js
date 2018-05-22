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
var notifications = 0;

var notloggedinrecall = false;

var token = "";

var picartoClientID = "Pb5mFzEq7MMetQ8p"
var redirectURI = "https://banderi.github.io/PicartoNotifier/redirect.html"
var crxID = "fifjhakdmflgahkghkijipchfomdajfn"
var picartoURL = "https://oauth.picarto.tv/authorize?redirect_uri=" + redirectURI + "&response_type=token&scope=readpub readpriv write&state=OAuth2Implicit&client_id=" + picartoClientID
var tokenRegex = RegExp("[&#]access_token=(.+?)(?:&|$)")

function OAuthConnect(interactive = false, callback) {
	console.log("Parsing oauth...");
	console.log("Redirect URI: " + redirectURI);
	browser.identity.launchWebAuthFlow({'url': picartoURL,'interactive': interactive}, (redirect_url) => {
		let parsed = tokenRegex.exec(redirect_url);
		console.log("Redirect received! Parsing...");
		if (parsed) {
			console.log("Logged in!");
			token = "Bearer " + parsed[1];
			storage.local.set({"OAUTH" : token});
			
			typeof callback === 'function' && callback();
		} else {
			token = "";
			console.group("OAuth2 Failed:");
			console.log(redirect_url);
			console.log(parsed);
			console.groupEnd();
			typeof callback === 'function' && callback();
		}
	});
}


async function getAPI(url, callback) {
	await $.ajax({
		url: "https://api.picarto.tv/v1/" + url,
		method: "GET",
		dataType: "json",
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		cache: false,
		beforeSend: function (xhr) {
			xhr.setRequestHeader("Authorization", token);
		},
		success: function (data) {
			/* console.log("woo!"); */
			
			typeof callback === 'function' && callback(data);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log("darn");
		}
	});
}

async function postAPI(url, callback) {
	await $.ajax({
		url: "https://api.picarto.tv/v1/" + url,
		method: "POST",
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		cache: false,
		beforeSend: function (xhr) {
			xhr.setRequestHeader("Authorization", token);
		},
		success: function (data) {
			/* console.log("woo!"); */
			
			typeof callback === 'function' && callback(data);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log(textStatus);
			console.log(errorThrown);
		}
	});
}

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

function updateAPI(callback) {
	
	storage.local.get(["OAUTH"], (data) => {
		if (data["OAUTH"])
			token = data["OAUTH"];
		if (token) {
			storage.local.get(["CACHESTAMP"], (data) => {
				if (data["CACHESTAMP"] && Date.now() < data["CACHESTAMP"] + 15000) {
					//
				} else {
					getAPI("user", function(a) {
						storage.local.set({"API_USER" : a});
						storage.local.set({"USERNAME" : a["channel_details"]["name"]});
					});
					getAPI("user/notifications", function(c) {
						if (c)
							notifications = c.length;
						else
							notifications = 0;
						updateBadge();
						storage.local.set({"API_NOTIFICATIONS" : c});
						
						// automatically remove notifications if setting is enabled
						if (settings["picartobar"] == true && c && c[0]) {
							for (n in c) {
								postAPI("user/notifications/" + c[n]["uuid"] + "/delete");
							}
							c = {};
							storage.local.set({"API_NOTIFICATIONS" : c});
						}
						
						
					});
				}
			});
			getAPI("user/multistream", function(b) {
				storage.local.set({"API_MULTISTREAM" : b});
			});
		}
	});
	typeof callback === 'function' && callback();
}

function updateBadge(callback) {
	
	browser.browserAction.setBadgeBackgroundColor( { color: settings["badgecolor"]} );
	
	// update badge text			
	var badgetext = "";
	var badgetooltip = "";
	
	
	// fetch multistream invites
	if (settings["streamer"] == true) {
		
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
	}
	else {		
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
	
	if(settings["badgenotif"] == true) {
		if (notifications == 1) {
			badgetext = "1";
			badgetooltip = "1 person streaming";
		} else if (notifications > 1) {
			badgetext = notifications.toString();
			badgetooltip = notifications.toString() + " notifications";
		} else {
			var badgetext = "";
			var badgetooltip = "";
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
			/* storage.local.set({"USERNAME" : ""}); */
			updateLive(()=>{
				updateAPI(()=>{
					updateBadge(()=>{
						// done!
					})
				})
			})
		}
	});
}

// get default settings or fetch from storage
let defaults = {
	"notifications" : true,
	"alert" : false,
	"streamer" : false,
	"picartobar" : false,
	"badgenotif" : false,
	"badgecolor" : "#33aa33"
};

var settings = $.extend(true, {}, defaults);
var updater;

function getSettings() {
	storage.local.get(["SETTINGS"], (data) => {
		for (let a in data["SETTINGS"]) {
			let setting = data["SETTINGS"][a];
			settings[a] = setting;
		}
		storage.local.get(["OAUTH"], (data) => {
			if (data["OAUTH"])
				token = data["OAUTH"];
			
			// start the update!
			update();
			updater = setInterval(update, 5000);
		});
	})
}

function restart() {
	clearInterval(updater);
	getSettings()
}

getSettings();

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
				console.log("Settings updated!");
			}
			for (s in request) {
				if (s != "message") {
					settings[s] = request[s];
				}
			}
			restart();
			break
		case "updateAll":
			restart();
			break
		case "purgeAll":
			settings = {};
			livecount = 0;
			invitecount = 0;
			ownname = "";
			exploreData = {};
			notloggedinrecall = false;
			token = "";
			restart();
			break;
		case "notificationRemoved":
			notifications -= 1;
			updateBadge();
			break;
		case "oauth":
			OAuthConnect(true, function() {
				browser.browserAction.getBadgeText({}, function(result) {
					sendResponse("OK");
				});
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