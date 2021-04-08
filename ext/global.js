if (chrome) {
	storage = chrome.storage;
	tabs = chrome.tabs;
	notifications = chrome.notifications;
	browser = chrome;
}
if (!browser.cookies) {
	browser.cookies = browser.experimental.cookies;
}
function isDevMode() {
    return !('update_url' in browser.runtime.getManifest());
}

var motd = "Fixed for new goddamn layout";

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

function IsNullOrWhitespace( input ) {
  return !input || !input.trim();
}

async function getCookies(domains, name, callback, failure) {
	for (d in domains) {
		// FORCE function to wait...
		const value = await new Promise((resolve, reject) => {
			browser.cookies.get({"url": domains[d], "name": name}, function(cookie) {
				if (cookie) {
					/* console.log(cookie); */
					resolve(cookie.value);
				} else reject();
			});
		}).catch(e => {
			if (e)
				console.log(e); // unexpected error???? otherwise, it's from "reject"
		});
		if (value && callback)
			return callback(value, domains[d]);
	}
	if (failure)
		return failure(); // none of the domains matched....
}
function setCookie(url, name, value, callback) {
	browser.cookies.set({"url": url, "name": name, "value": value}, function() {
		if (callback)
			callback();
	});
}

function OAuthConnect(interactive = false, callback) {
	console.log("Parsing oauth...");
	console.log("Redirect URI: " + redirectURI);
	browser.identity.launchWebAuthFlow({'url': picartoURL,'interactive': interactive}, (redirect_url) => {
		let parsed = tokenRegex.exec(redirect_url);
		console.log("Redirect received! Parsing...");
		if (parsed) {
			console.log("Logged in!");
			token = parsed[1];
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
	try {
		await $.ajax({
			url: "https://api.picarto.tv/v1/" + url,
			method: "GET",
			dataType: "json",
			crossDomain: true,
			contentType: "application/json; charset=utf-8",
			cache: false,
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", "Bearer " + token);
			},
			success: function (data) {
				/* console.log("woo!"); */
				
				typeof callback === 'function' && callback(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log(jqXHR.responseText);
			}
		});
	} catch (e) {
		//
	}
}
async function postAPI(url, callback) {
	await $.ajax({
		url: "https://api.picarto.tv/v1/" + url,
		method: "POST",
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		cache: false,
		beforeSend: function (xhr) {
			xhr.setRequestHeader("Authorization", "Bearer " + token);
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
			
			$.post("https://picarto.tv/process/explore", {follows: true}).done(function(data) {
				exploreData = JSON.parse(data);
				if (exploreData[0] && exploreData[0].error == "notLoggedin") {
					if (isDevMode()) {
						console.log("Yup, user is not logged in!");
					}
					storage.local.clear();
					storage.local.set({"USERNAME" : false});
				}
			});
		},
		error: function() {
			console.log("Whoops. AJAX on Picarto failed!");
		}
	});
	notloggedinrecall = true;
}

function notify(name, type, avatarurl) {
	
	if (type == "live") {
		if (settings.notifications) {										
			browser.notifications.create(name, {
				type: "basic",
				iconUrl: avatarurl,
				title: "Currently streaming on Picarto:",
				message: name
			}, function() {});
			if (settings.alert)
				ding.play();
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
				if (exploreData[i].channel_name && name === exploreData[i].channel_name) {
					
					exploreData[i]["old"] = true;
					user["live"] = true;
					
					/* continue; */
				}
			}
			
			// user no longer online
			if (!user["live"]) {
				
				// remove user from cache
				delete livecache[u]
				if (isDevMode())
					console.log("User '" + name + "' no longer online (removed from cache)");
			}
		}
		
		// add the remaining users and dispatch notifications
		for (i in exploreData) {
			
			let name = exploreData[i].channel_name;
			let user = exploreData[i];
			let avatarurl = exploreData[i].avatar;
			
			cleanData[name] = user;
			
			// new user online
			if (!user["old"]) {
				if (isDevMode())
					console.log(name + " just started streaming!");
				
				// dispatch live notification (or not)
				notify(name, "live", avatarurl);
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
		if (data["OAUTH"]) {
			token = data["OAUTH"];
			if (token.indexOf(' ') != -1) {
				token = token.substr(token.indexOf(' ') + 1);
				storage.local.set({"OAUTH" : token});
			}
			if (IsNullOrWhitespace(token)) {
				token = "";
				storage.local.remove("OAUTH");
			}
		}
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
						
						storage.local.set({"API_NOTIFICATIONS" : c});
						
						// automatically remove notifications if setting is enabled
						if (settings.picartobar && c && c[0]) {
							for (n in c) {
								postAPI("user/notifications/" + c[n]["uuid"] + "/delete");
							}
							c = {};
							storage.local.set({"API_NOTIFICATIONS" : c});
							notifications = 0;
						}
						
					});
				}
			});
			getAPI("user/multistream", function(b) {
				if (b["incoming"])
					invitecount = b["incoming"].length;
				else
					invitecount = 0;
				storage.local.set({"API_MULTISTREAM" : b});
			});
		}
		updateBadge();
	});
	typeof callback === 'function' && callback();
}
function updateBadge(callback) {
	browser.browserAction.setBadgeBackgroundColor( { color: settings.badgecolor} );
			
	var badgetext = "";
	var badgetooltip = "";
	
	if(settings.badgenotif) {
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
	else {
		if (settings.streamer) {
			
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
	}
	
	
	
	typeof callback === 'function' && callback();
}
function updateMOTD() {
	let version = browser.runtime.getManifest().version;	
	if (settings.updatemsg) {
		storage.sync.get(["MOTD"], (data) => {
			if ((data["MOTD"] && data["MOTD"] != "" && data["MOTD"].split('.').slice(0,2).join(".") != version.split('.').slice(0,2).join(".")) || !data["MOTD"] || data["MOTD"] == "") {
				browser.notifications.create("MOTD", {
					type: "basic",
					iconUrl: "icons/icon128.png",
					title: "Picarto Notifier updated to " + version.toString().substr(0, 3) + "!",
					message: motd
				}, function() {});
			}
			storage.sync.set({"MOTD" : version});
		});
	}
	else
		storage.sync.set({"MOTD" : version});
}

function scrapeConnectionsPage() { // completely broken, past code snippet only here for future potential usage
	// get multistream data
	$.ajax({
		url: "https://picarto.tv/settings/connections/following",
		success: function(data) {
			if (isDevMode()) {
				console.log('Scraping "Connections" page...');
				/* console.log($(data).find('.ant-avatar-image')); */
				console.log(data);
			}
			/* var ownname = $(data).find("#channelnamejs").val();
			storage.local.set({"USERNAME":ownname}, function() {
				//
			}); */
			
			var parse;
			parse = $(data).find('tr:contains("Live")').find('img');
			parse.each(function(i) {
				
				var name = $(this).attr('alt');
				var thumbnail = $(this).attr('src');
				
				exploreData[i] = {
					"channel_name": name,
					"thumbnail": thumbnail
				}
				
				if (isDevMode()) console.log(exploreData[i]);
			});
			
			updateLive(()=>{
				/* updateAPI(()=>{ */
					updateBadge(()=>{
						updateMOTD(); // done!
					})
				/* }) */
			})
		},
		error: function(data) {
			if (isDevMode()) console.log(data); // oh no
		}
	});
}

function fetch_from_cookies() {
	// first, fetch auth bearer token from cookies
	console.log("testing for ptv_auth_perm");
	getCookies(["https://picarto.tv", "http://picarto.tv", "https://www.picarto.tv", "http://www.picarto.tv"], "ptv_auth_perm",
		function(a) {
			fetch_channel_data("Bearer " + (JSON.parse(a)["access_token"]));
		},
		function() {
			console.log("not found.... testing for ptv_auth");
			getCookies(["https://picarto.tv", "http://picarto.tv", "https://www.picarto.tv", "http://www.picarto.tv"], "ptv_auth",
				function(a) {
					console.log("setting ptv_auth_perm!");
					fetch_channel_data("Bearer " + (JSON.parse(a)["access_token"]));
					setCookie("http://www.picarto.tv", "ptv_auth_perm", a);
				}, // success callback
				function() {
					console.log("not found :,(");
					storage.local.set({"ERROR" : 1});
					return;
					
					// if cookie is not present, ask for new token??
					getCookies(["https://picarto.tv", "http://picarto.tv", "https://www.picarto.tv", "http://www.picarto.tv"], "picartoCookieID", function(ptv_id) {
						let querytosend = {
							operationName: "generateToken",
							query: "query generateToken($channel_id: Int!) {\n  __typename\n  generateJwtToken(channel_id: $channel_id) {\n    key\n    __typename\n  }\n}\n",
							variables: {
								"channel_id": ptv_id
							}
						}
						$.ajax({
							url: "https://ptvintern.picarto.tv/ptvapi",
							type:"POST",
							data:JSON.stringify(querytosend),
							contentType:"application/json; charset=utf-8",
							/* beforeSend: function (xhr) {
								xhr.setRequestHeader('authorization', auth_bear);
							}, */
							dataType:"json",
							success: function(data) {
								let token = "Bearer " + data["data"]["generateJwtToken"]["key"];
								fetch_channel_data(token);
								/* setCookie("https://picarto.tv", "ptv_auth", JSON.stringify({"access_token":token}), function() {
									fetch_channel_data(token);
								}); */
							},
							error: function(data) {
								if (isDevMode()) console.log(data); // oh no
							}
						});
					});
				}
			)
		} // failure callback
	);
}
function fetch_channel_data(auth_bear) {
	
	let querytosend = {
		query: "query ($first: Int!, $page: Int!, $q: String) {\n  following(first: $first, page: $page, q: $q, orderBy: {field: \"last_live\", order: DESC}) {\n    account_type\n    avatar\n    channel_name\n    id\n    last_live\n    online\n    __typename\n  }\n}\n",
		variables: {
			"first": settings.maxnames,
			"page": 1,
			"q": ""
		}
	}
	
	$.ajax({
		url: "https://ptvintern.picarto.tv/ptvapi",
		type:"POST",
		data:JSON.stringify(querytosend),
		contentType:"application/json; charset=utf-8",
		beforeSend: function (xhr) {
			xhr.setRequestHeader('authorization', auth_bear);
		},
		dataType:"json",
		success: function(data) {
			
			if (!data["data"]) {
				console.log("ERROR: " + data["errors"][0]["errorDescription"]);
				return;
			}
			
			var parse = data["data"]["following"];
			
			for (i in parse) {
				if (parse[i]["online"] == false) {
					delete parse[i];
					continue;
				}
			}
			
			if (isDevMode()) {
				/* console.log('Scraping "Connections" page...'); */
				/* console.log($(data).find('.ant-avatar-image')); */
				console.log(parse);
			}
			
			exploreData = parse;
			
			updateLive(()=>{
				/* updateAPI(()=>{ */
					updateBadge(()=>{
						updateMOTD(); // done!
					})
				/* }) */
			})
		},
		error: function(data) {
			if (isDevMode()) console.log(data); // oh no
		}
	});
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

var updater = null;

// main update function
function update() {
	storage.local.set({"ERROR" : 0});
	
	storage.sync.get("OAUTH", (v) => {
		token = v["OAUTH"];
		fetch_channel_data("Bearer " + token);
	});
	
	updater = setTimeout(update, settings.updateinterval * 1000);
}

function startup() {
	storage.sync.get(["SETTINGS"], (data) => {
		for (let a in data["SETTINGS"]) {
			let setting = data["SETTINGS"][a];
			settings[a] = setting;
		}
		storage.sync.get(["OAUTH"], (data) => {
			if (data["OAUTH"])
				token = data["OAUTH"];
			
			// set notif volume
			ding.volume = parseFloat(settings.dingvolume) / 100;
			
			// start the update!
			if (!updater)
				update();
		});
	});
}

function restart() {
	initSettings(startup);
}
restart();

// create audio alert object
var ding = new Audio('audio/ding.ogg');

// add listener to the desktop notification popups
browser.notifications.onClicked.addListener(function(notificationId) {
	if (notificationId !== "MOTD") {
		if (isDevMode()) {
			console.log("Notification clicked! ID: " + notificationId);
		}
		window.open('https://picarto.tv/' + notificationId, '_blank');
		browser.notifications.clear(notificationId, function() {});
	}
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
		case "tabID":
			sendResponse({tab: sender.tab.id});
			break;
		}
		return false;
	}
);