if (chrome) {
	storage = chrome.storage;
	tabs = chrome.tabs;
	notifications = chrome.notifications;
	browser = chrome;
}
function isDevMode() {
    return !('update_url' in browser.runtime.getManifest());
}

var notloggedinrecall = "nan";

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
	notloggedinrecall = "notloggedin";
	//notloggedinrecall = setInterval(loggedintest, 100000);
}

// main update function
function update() {
	
	if (1) {
		var obj;
		//var request = new XMLHttpRequest();
		//var url = "https://picarto.tv/process/explore";
		//var params = "follows=true";
		//request.open("POST", url, true);
		//request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//request.send(params);
		// request.onreadystatechange = function () {
			// if (request.readyState == request.DONE && request.status == 200) {
				// obj = JSON.parse(request.responseText);
				
				// //
			// }
			// else if (request.readyState == request.DONE) {
				// if (isDevMode()) {
					// console.log(request.status + " : " + request.responseText);
				// }
			// }
		// }
		
		
		$.post("https://picarto.tv/process/explore", {follows: true}).done(function(data) {
			obj = JSON.parse(data);
			
			if (isDevMode()) {
				console.log("Updating...");
			}
			
			// check user session
			if (obj[0] && obj[0].error == "notLoggedin") {
				storage.local.clear();
				if (isDevMode()) {
					console.log("User is not logged in!");
				}
				if (notloggedinrecall == "nan") {
					loggedintest();
				}
			}
			else {
				//clearInterval(notloggedinrecall);
				notloggedinrecall = "nan";
			}
			
			var users = [];
			var livecount = 0;
			var invitecount = 0;
			
			var parse;
			
			// update currently followed - first fetch from storage full list of cached users
			storage.local.get(null, function(items) {
				parse = obj;
				
				var user_item = {};
				
				// loop through cached users to update for removal
				for (key in items) {
					if (key == "MULTISTREAM_SESSION" || key == "USERNAME" || key == "SETTINGS") {
						continue;
					}
					followed_user = key;
					
					var is_live = false;
					
					// loop through the response JSON of currently live users
					for (index in parse) {
						var name = parse[index].channel_name;
						
						// got a match!
						if (name === followed_user) {
							is_live = true;
						}
					}
					
					// check if user is still followed/online
					if (!is_live) {
						if (isDevMode()) {
							console.log("User '" + followed_user + "' is not followed or online anymore - will be removed!");
						}
						
						// remember name for async procedures
						var remove_name = followed_user;
						
						storage.local.remove(remove_name, function() {
							if (isDevMode()) {
								console.log(remove_name + " removed from the storage list!");
							}
						});
					}
				}
				
				// add live users
				for (index in parse) {
					if (parse[index].error == "notLoggedin") {
						break;
					}
					var name = parse[index].channel_name;
					
					user_item[name] = parse[index];
					if (isDevMode()) {
						//console.log("User: " + name);
					}
				}
				
				// build array of users to loop through with promises
				var index = 0;
				var users = [];
				for (name in user_item) {
					users[index] = name;
					index++;
				}
				if (isDevMode()) {
					//console.log("Users: " + users);
				}
				
				// check though cached users and dispatch streaming notification/alert
				index = 0;
				var loop = function() {
					if (index < users.length) {
						var promise = new Promise(function(resolve, reject) {
							var name = users[index];
							if (isDevMode()) {
								//console.log("Current name: " + name);
							}
							storage.local.get(name, function(item) {
								if (isDevMode()) {
									//console.log(item[name]);
									//console.log("Checking key : " + name + " : " + item[name]);
								}
								if (!item[name]) {
									if (isDevMode()) {
										console.log(name + " is live!");
									}
									if (notifications == "true") {										
										browser.notifications.create(name, {
											type: "basic",
											iconUrl: "https://picarto.tv/user_data/usrimg/" + name.toLowerCase() + "/dsdefault.jpg",
											title: "Currently streaming on Picarto:",
											message: name
										}, function() {});
										if (alert == "true") {
											ding.play();
										}
									}
								}
								index++;
								loop();
							});
						});
					}
					else if (index == users.length) {
					
						// update storage with cached users
						storage.local.set(user_item, function() {
							if (isDevMode()) {
								//console.log("Setting keys: " + user_item);
							}
							index++;
							loop();
						});
					}
					else return;
				};				
				loop();
				
				if (isDevMode()) {
					browser.browserAction.setBadgeBackgroundColor( { color: "#33aa33"} );
				}
				
				// update badge text			
				var badgetext = "";
				var badgetooltip = "";
				
				livecount = users.length;
				
				// fetch multistream invites
				if (streamer == "true") {
					
					// get multistream data
					$.ajax({
						url: "https://picarto.tv/settings/multistream",
						success: function(data) {
							if (isDevMode()) {
								console.log("Fetching multistream data...");
							}
							
							var ownname = $(data).find("#channelnamejs").val();
							storage.local.set({"USERNAME":ownname}, function() {
								//
							});
							
							var parse;
							var invites = {};
							
							parse = $(data).find('.ms_dec');
							parse.each(function(index) {
								var id = $(this).attr('value');
								var name = $(this).parent().parent().children().eq(0).text();
								var status = "";
								if ($(this).hasClass("decline_ms_invitation")) {
									status = "received";
									invitecount++;
								}
								else if ($(this).hasClass("leave_ms")) {
									status = "attending";
								}
								else if ($(this).hasClass("revoke_inv")) {
									status = "sent";
								}
								else if ($(this).hasClass("remove_ms")) {
									status = "hosting";
								}
								var invite_element = {"name" : name, "id" : id, "status" : status};
								invites[index] = invite_element;
							});
							
							storage.local.set({"MULTISTREAM_SESSION":invites}, function() {
								//
							});
							//invitecount = parse.length;
							if (isDevMode()) {
								console.log("Live: " + livecount);
								console.log("Invites: " + invitecount);
							}
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
					});
				}
				else {
					if (isDevMode()) {
						console.log("Live: " + livecount);
					}				
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
			});
		});
	}
	else {
		$.ajax({
			url: "https://picarto.tv/settings/connections",
			success: function(data) {
				if (isDevMode()) {
					console.log("Updating...");
				}
				
				// check user session
				storage.local.get("ACCOUNT_SESSION_USERNAME", function(item) {
					if ($(data).find('.usermenu_username').text() !== item["ACCOUNT_SESSION_USERNAME"]) {
						storage.local.clear();
					}
					
					// update user session
					parser = new DOMParser();
					doc = parser.parseFromString(data, "text/html");	
					if (isDevMode()) {
						console.log("DOCParser replied with username: '" + $(doc).find('.usermenu_username').text() + "'");
					}
					storage.local.set({"ACCOUNT_SESSION_USERNAME" : $(doc).find('.usermenu_username').text()});
					
					var users = [];			
					var count = 0;
					
					var parse;
					
					// update currently followed
					storage.local.get(null, function(items) {
						parse = $(data).find('.conn_user');
						
						// loop through current saved users
						for (key in items) {
							if (key == "ACCOUNT_SESSION_USERNAME") {
								continue;
							}
							followed_user = key;
							
							var is_followed = false;
							
							parse.each(function(index) {
								var name = $(this).text();
								var team = $(this).closest(".col-xs-12").find(".con_headings").children().eq(0);
								
								// check if followed team
								if (team.text() !== "Following") {
									return true;
								}
								
								if (name === followed_user) {
									is_followed = true;
								}
							});
							
							// check if user is followed
							if (!is_followed) {
								if (isDevMode()) {
									console.log("WARNING: '" + followed_user + "' is not in the follow list - will be removed!");
								}
								
								// remember name for async procedures
								var remove_name = followed_user;
								
								storage.local.remove(remove_name, function() {
									if (isDevMode()) {
										console.log(remove_name + " removed from the storage list!");
									}
								});
							}
						}
					});
					
					// update currently streaming
					parse = $(data).find('.onlineLabel');				
					parse.each(function(index) {
						var name = $(this).parent().parent().find('.col-xs-7').find('.conn_user').text();
						
						var team = $(this).closest(".col-xs-12").find(".con_headings").children().eq(0);
						if (isDevMode()) {
							console.log("team: " + team.text());
						}
						
						// check if followed
						if (team.text() !== "Following") {
							return true;
						}
						
						var user_item = {};
						
						// look for people live
						if ($(this).find('i').length) {
							user_item[name] = 1;
							
							// update badge counter
							if ($.inArray(name, users) == -1) {
								users.push(name);
								count += 1;
								
								// dispatch streaming notification/alert
								storage.local.get(name, function(item) {
									if (item[name] != 1) {
										if (notifications == "true") {										
											browser.notifications.create(name, {
												type: 'basic',
												iconUrl: 'icons/icon128.png',
												title: 'Currently streaming on Picarto:',
												message: name
											}, function() {});
											if (alert == "true") {
												ding.play();
											}
										}
									}
								});
							}
						} else {
							user_item[name] = 0;
						}
						storage.local.set(user_item);
					});
					
					if (isDevMode()) {
						browser.browserAction.setBadgeBackgroundColor( { color: "#33aa33"} );
					}
					
					// update badge text
					if (count == 1) {
						browser.browserAction.setBadgeText( {"text": "1"} );
						browser.browserAction.setTitle( {"title": "1 person currently streaming!"} );
					} else if (count > 1) {
						browser.browserAction.setBadgeText( {"text": count.toString()} );
						browser.browserAction.setTitle( {"title": count.toString() + " people currently streaming!"} );
					} else {
						browser.browserAction.setBadgeText( {"text": ""} );
						browser.browserAction.setTitle( {"title": "Nobody is currently streaming"} );
					}				
				});
				
				if (isDevMode()) {
					console.log("Update!");
				}
			},
			error: function() {
				browser.browserAction.setBadgeText( {"text": "??"} );
				browser.browserAction.setTitle( {"title": "Error updating!"} );
				console.log("--Error updating!--");
			}
		});
	}
}

// fetch saved settings or generate default ones
var settings = {};				// g
var updateTime = "300000";		// s
var notifications = "true";		// s
var alert = "false";			// s
var streamer = "false";			// s
//var dashboard = {};				// +
var account = "free";			// n
var picartobar = "true"			// s

var updater;

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
		// if (settings["dashboard"]) {
			// dashboard = settings["dashboard"];
		// }
		if (settings["picartobar"]) {
			picartobar = settings["picartobar"];
		}
	}
	
	// start the update!
	update();
	updater = setInterval(update, updateTime);
	
	// hide Picarto official notification bar
	if (picartobar == "true")
	{
		if (isDevMode()) {
			console.log("Hiding official Picarto bar");
		}
		browser.webRequest.onBeforeRequest.addListener(
			function() { return {cancel: true}; },
			{
				urls: ["*://*.picarto.tv/js/realtime_notifications.min.js"],
				types: ["script"]
			},
			["blocking"]
		);
	}
});

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
		if (request.message == "setCount")
		{
			setCount(request.count);
		}
		else if (request.message == "settingChanged")
		{
			if (isDevMode()) {
				console.log("New settings - update: " + request.update);
			}
			clearInterval(updater);
			updateTime = request.update;
			updater = setInterval(update, updateTime);
			notifications = request.notifications;
			alert = request.alert;
			streamer = request.streamer;
		}
		else if (request.message == "updateAll")
		{
			clearInterval(updater);
			updater = setInterval(update, updateTime);
		}
		else if (request.message == "getFullStorage")
		{
			if (isDevMode()) {
				console.log("getFullStorage");
			}
			storage.local.get(null, function(items) {
				sendResponse(items);
			});
			return true;
		}
		else if (request.message == "getBadgeText")
		{
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