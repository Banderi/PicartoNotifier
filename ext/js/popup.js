if (chrome) {
	storage = chrome.storage;
	tabs = chrome.tabs;
	notifications = chrome.notifications;
	browser = chrome;
}
function isDevMode() {
    return !('update_url' in browser.runtime.getManifest());
}

var notificationMsgs = [];
notificationMsgs[1] = "Please login or register to follow.";
notificationMsgs[2] = "You can not follow yourself.";
notificationMsgs[3] = "Please enter username and password.";
notificationMsgs[4] = "Username or Password wrong.";
notificationMsgs[5] = "Not allowed to use this function!";
notificationMsgs[6] = "Please check image type! Only GIF allowed.";
notificationMsgs[7] = "Please check image type!";
notificationMsgs[8] = "Please enter a valid URL beginning with http:// or https://";
notificationMsgs[9] = "You are already logged in. Please wait, you will be redirected in 3 seconds.";
notificationMsgs[10] = "Only letters are allowed in username.";
notificationMsgs[11] = "Username is too long. Max 20 characters!";
notificationMsgs[12] = "Please type in a username.";
notificationMsgs[13] = "Username is registered or already in use!";
notificationMsgs[14] = "Please fill in all fields.";
notificationMsgs[15] = "Please solve captcha.";
notificationMsgs[16] = "Are you a robot?";
notificationMsgs[17] = "You can only invite up to three channels.";
notificationMsgs[18] = "You can't invite yourself.";
notificationMsgs[19] = "You have already invited this channel.";
notificationMsgs[20] = "This channel doesn't exist.";
notificationMsgs[21] = "Please type in a valid channel name.";
notificationMsgs[22] = "You can only participate in one multistream at a time.";
notificationMsgs[23] = "Please login or register to use this function.";
notificationMsgs[24] = "Subject is too long. Max 50 characters!";
notificationMsgs[25] = "Message is too long. Max 8000 characters!";
notificationMsgs[26] = "Missing arguments. Please use the report button on channel page!";
notificationMsgs[27] = "Please type in a valid email.";
notificationMsgs[28] = "There is no account related to this email.";
notificationMsgs[29] = "New password already activated or invalid activation key.";
notificationMsgs[30] = "Account already activated or invalid activation key.";
notificationMsgs[31] = "Please enter a valid key.";
notificationMsgs[32] = "This stream is now a private stream. Please request secret url from streamer.";
notificationMsgs[33] = "Please switch to public mode to participate on multi streams.";
notificationMsgs[34] = "Your account is not activated yet.";
notificationMsgs[35] = "Your account has been banned.";
notificationMsgs[36] = "You are not allowed to disable the adult tag if your content type is NSFW related.";
notificationMsgs[37] = "Unable to get stream.";
notificationMsgs[38] = "Please upload only jpg or PNG image.";
notificationMsgs[39] = "Adobe Flash Player is either not installed or not activated in your browser.";
notificationMsgs[53] = "Please add at least a Title, Description or an Image.";
notificationMsgs[54] = "Please enter a valid link (http://some-thing.com/).";
notificationMsgs[55] = "The file size is too big, please use smaller file (2 Mb max)";
notificationMsgs[71] = "Please type at least a Title. Maximum 60 characters.";
notificationMsgs[72] = "Please add correct URL. (eg. http://google.com )";
notificationMsgs[73] = "Please add correct title. (HTML is not allowd in title)";
notificationMsgs[74] = "You can not start multistream sessions with a free account.";

// display debug messages, errors and info
function displayNotificationMsg(id) {
	if (isDevMode()) {
		console.log(notificationMsgs[id]);
	}
	$("#msgbox").text(notificationMsgs[id]);
	$("#msgbox").parent().clearQueue().stop().fadeIn(100).delay(1000).fadeOut();
}
function displayErrorMsg(id) {
	if (isDevMode()) {
		console.log("Whoops, that's an internal error. ID: " + id);
	}
	$("#msgbox").text("Picarto internal error: " + id);
	$("#msgbox").parent().clearQueue().stop().fadeIn(100).delay(1000).fadeOut();
}

// open streaming page from popup link
function openStreamer(name) {
	window.open('https://picarto.tv/' + name, '_blank');
	notifications.clear(name, function() {});
	window.close();
}

//Iterates over an array of items to return the index of the first item that matches the provided val ('needle') in a case-insensitive way.  Returns -1 if no match found.
function inArrayCaseInsensitive(needle, haystackArray){
	var defaultResult = -1;
	var result = defaultResult;
	$.each(haystackArray, function(index, value) { 
		if (result == defaultResult && value.toLowerCase() == needle.toLowerCase()) {
			result = index;
		}
	});
	return result;
}

var recentnames = [];
var peoplelive = false;
var multistream = false;

var token = "";

var livecache = {};
var multicache = {};
var usercache = {};
var notifcache = {};
var recordcache = {};

var ownname = "";

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

function appendLiveLink(name, thumb) {
	$('#con_live').append(
		$('<div/>', {'class': 'conn_streamer', 'id': name}).append(
			$('<div/>', {'class': 'conn_streamer_head'}).append(
				$('<div/>', {'class': 'col'}).append(
					$('<img/>', {'class': 'conn_avatar'}).attr("src", thumb)
				)
				.append(
					$('<span/>', {'class': 'conn_user', text: name})
				)
				.append(
					$('<span/>', {'class': 'ms_button ms_inv', 'title': 'Invite to multistream', 'value': name}).append(
						$('<i/>', {'class': 'icon'}).html('&#xe814;')
					)
				)
			)
		)
	);
	
	if (!token)
		$(".ms_button").hide();
};
function appendMultiCard(name, thumb, id, type) {
	$('#ms_invites').append(
		$('<div/>', {'class': 'conn_invite'}).append(
			$('<div/>', {'class': 'conn_streamer_head'}).append(
				$('<div/>', {'class': 'col live'}).append(
					$('<img/>', {'class': 'conn_avatar'}).attr("src", thumb)
				)
			)
		)
	);
	
	let card = $(".col.live").last();
	
	// incoming invites
	if (type == "incoming") {
		card.append(
			$('<span/>', {'class': 'conn_user', text: "Invite from " + name})
		)
		.append(
			$('<span/>', {'class': 'ms_button ms_acc', 'title': 'Accept invite', 'value': id}).append(
				$('<i/>', {'class': 'icon'}).html('&#xe812;')
			)
		)
		.append(
			$('<span/>', {'class': 'ms_button ms_dec', 'title': 'Decline invite', 'value': id}).append(
				$('<i/>', {'class': 'icon'}).html('&#xe813;')
			)
		);
	} // outgoing invites
	else if (type == "outgoing") {
		card.append(
			$('<span/>', {'class': 'conn_user', text: "Awaiting..."})
		)
		.append(
			$('<span/>', {'class': 'ms_button ms_rev', 'title': 'Cancel invite', 'value': id}).append(
				$('<i/>', {'class': 'icon'}).html('&#xe813;')
			)
		);
	} // guests you are hosting
	else if (type == "guest") {
		card.append(
			$('<span/>', {'class': 'conn_user', text: "Accepted!"})
		)
		.append(
			$('<span/>', {'class': 'ms_button ms_rev', 'title': 'Revoke invite', 'value': id}).append(
				$('<i/>', {'class': 'icon'}).html('&#xe813;')
			)
		);
	} // attending someone else's stream
	else if (type == "host") {
		card.append(
			$('<span/>', {'class': 'conn_user', text: name})
		)
		.append(
			$('<span/>', {'class': 'ms_button ms_dec', 'title': 'Leave session', 'value': id}).append(
				$('<i/>', {'class': 'icon'}).html('&#xe813;')
			)
		);
	}
}
function appendNotificationCard(name, thumb, uuid, timestamp, type) {
	$('#con_notifications').prepend(
		$('<div/>', {'class': 'conn_notification'}).append(
			$('<div/>', {'class': 'conn_streamer_head'}).append(
				$('<div/>', {'class': 'col notif'}).append(
					$('<img/>', {'class': 'conn_avatar'}).attr("src", thumb)
				)
			)
		)
	);
	
	let card = $(".col.notif").first();
	let msg = "";
	
	// live notification
	if (type == "live")
		msg = " is now live";
	else if (type == "multiInvite")
		msg = " invited you";
	else if (type == "multiAccept")
		msg = " accepted your invite";
	else if (type == "multiLeave")
		msg = " left your multistream";
	else if (type == "multiRemove")
		msg = " has revoked your invite";
	else if (type == "recordingCreate")
		msg = " created a new recording";
	else if (type == "follow")
		msg = " followed you";
	
	let d = new Date(timestamp);
	
	card.append(
		$('<span/>', {'class': 'conn_user notif', text: msg}).prepend(
			$('<span/>', {'class': 'conn_user notif name', text: name})
		)
	)
	.append(
		$('<span/>', {'class': 'conn_user timestamp', text: d.toLocaleString()})
	)
	.append(
		$('<span/>', {'class': 'ms_button ms_read', 'title': 'Mark as read', 'value': uuid}).append(
			$('<i/>', {'class': 'icon'}).html('&#xe813;')
		)
	);
}

function updateLive(callback) {
	storage.local.get("LIVE", function(items) {
		
		// cache didn't change, so don't kill the DOM
		if (JSON.stringify(livecache) === JSON.stringify(items["LIVE"])) {
			//
		} else {
			$('#con_live').empty();
			
			livecache = items["LIVE"];
			peoplelive = false;
			
			// loop through cached users
			for (u in livecache) {
				
				let name = u;
				let user = livecache[u];
				let thumb = user["avatar"];
				
				var found = jQuery.inArray(name, recentnames);
				if (found >= 0) {
					// name already present
				} else {
					recentnames.push(name);
				}
				storage.sync.set({"RECENTNAMES" : recentnames});
				
				
				// add link to the window				
				appendLiveLink(name, thumb);
				
				peoplelive = true;
			}
			
			
			// register the links
			var links = $('.conn_streamer');
			links.each(function() {
				var name = $(this).attr('id');
				document.getElementById(name).addEventListener('click', function() {
					openStreamer(name);
				});
			});
		}
		
		if (peoplelive) {
			$('#con_headings').text("Currently streaming:");
			$('#con_headings').addClass("streaming");
		} else {
			$('#con_headings').text("Nobody is currently streaming.");
			$('#con_headings').removeClass("streaming");
		}
		
		typeof callback === 'function' && callback();
	});
}
function updateMulti(callback) {
	storage.local.get("API_MULTISTREAM", function(items) {
		
		// cache didn't change, so don't kill the DOM
		if (!items["API_MULTISTREAM"] || items["API_MULTISTREAM"] == "" || JSON.stringify(multicache) === JSON.stringify(items["API_MULTISTREAM"])) {
			typeof callback === 'function' && callback();
			return;
		}
		
		$('#ms_invites').empty();
		
		multicache = items["API_MULTISTREAM"];
		
		let m = multicache;
		if (m["incoming"][0] || m["outgoing"][0] || m["session"]["guests"][0]) {
			multistream = true;
			
			let newnames = [];
			
			for (i in m["incoming"]) {
				let o = m["incoming"][i];
				let name = o["name"];
				let thumb = o["avatar"];
				appendMultiCard(name, thumb, o["user_id"], "incoming");
				newnames.push(name);
			}
			for (i in m["outgoing"]) {
				let o = m["outgoing"][i];
				let name = o["name"];
				let thumb = o["avatar"];
				appendMultiCard(name, thumb, o["user_id"], "outgoing");
				newnames.push(name);
			}
			if (m["session"]["host"]["name"] == ownname)
				for (i in m["session"]["guests"]) {
					let o = m["session"]["guests"][i];
					let name = o["name"];
				let thumb = o["avatar"];
					appendMultiCard(name, thumb, o["user_id"], "guest");
					newnames.push(name);
				}
			if (m["session"]["host"] && m["session"]["host"]["name"] != ownname && m["session"]["active"] == true) {
				let o = m["session"]["host"];
				let name = o["name"];
				let thumb = o["avatar"];
				appendMultiCard(name, thumb, o["user_id"], "host");
				newnames.push(name);
			}
			
			for (i in newnames) {
				let name = newnames[i];
				var found = jQuery.inArray(name, recentnames);
				if (found >= 0) {
					// name already present
				} else {
					recentnames.push(name);
				}
				storage.sync.set({"RECENTNAMES" : recentnames});
			}
		}
		
		typeof callback === 'function' && callback();
	});
}
function updateNotifications() {
	
	if (settings.picartobar && notifcache[0]) {
		for (n in notifcache) {
			postAPI("user/notifications/" + notifcache[n]["uuid"] + "/delete");
		}
		notifcache = {};
		storage.local.set({"API_NOTIFICATIONS" : notifcache});
		$('#con_notifications').empty();
		let cachestamp = Date.now();
		browser.storage.local.set({"CACHESTAMP" : cachestamp});
	}
	
	storage.local.get("API_NOTIFICATIONS", function(items) {
		
		// cache didn't change, so don't kill the DOM
		if (!items["API_NOTIFICATIONS"] || JSON.stringify(notifcache) === JSON.stringify(items["API_NOTIFICATIONS"])) {
			return;
		}
		
		$('#con_notifications').empty();
		
		notifcache = items["API_NOTIFICATIONS"];
		
		for (i in notifcache) {
			if (notifcache[i]["unread"] == true || true) {
				let name = notifcache[i]["channel"];
				let uuid = notifcache[i]["uuid"];
				let timestamp = notifcache[i]["timestamp"];
				let type = notifcache[i]["type"];
				let thumb = notifcache[i]["avatar"];
				appendNotificationCard(name, thumb, uuid, timestamp, type);
			}
		}
		
		// register notifications read buttons
		$('.ms_read').each(function() {
			let inv = $(this);
			let id = $(this).attr('value');
			$(this).off().on('click', function() {
				postAPI("user/notifications/" + id + "/delete", function(data) {
					inv.parent().parent().parent().remove();
					
					var obj = notifcache.find(function (obj) { return obj.uuid === id; });
					var i = notifcache.indexOf(obj);
					if (i !== -1)
						notifcache.splice(i, 1);
					
					let cachestamp = Date.now();
					browser.storage.local.set({"CACHESTAMP" : cachestamp});
					storage.local.set({"API_NOTIFICATIONS" : notifcache});
					
					if (notifcache[0]) {
						$('#notif_badge').show();
						$('#notif_badge').text(notifcache.length);
					}
					else
						$('#notif_badge').hide();
					
					let msg = {"message" : "notificationRemoved"};
					browser.runtime.sendMessage(msg);
				});
			}).on('mouseover', function() {
				$(this).parent().parent().parent().css("background-color", "rgba(116, 57, 52, 0.95)")
			}).on('mouseout', function() {
				$(this).parent().parent().parent().css("background-color", "#5b616c")
			});
		});
		
		if (notifcache[0]) {
			$('#notif_badge').show();
			$('#notif_badge').text(notifcache.length);
		}
		else
			$('#notif_badge').hide();
	});
}
function updateRecordings() {
	storage.local.get("API_RECORDINGS", function(items) {
		
		// cache didn't change, so don't kill the DOM
		if (!items["API_RECORDINGS"] || JSON.stringify(recordcache) === JSON.stringify(items["API_RECORDINGS"])) {
			return;
		}
		
		$('#con_recordings').empty();
		
		recordcache = items["API_RECORDINGS"];
		
		
		
	});
}

function setGameMode(value) {
	$.post("https://picarto.tv/process/dashboard", {setGameMode: value}, function(data) {
		if (data == "gameModeOk") {
			let dashboard = usercache["channel_details"];
			
			if (value == 1) {
				dashboard["gaming"] = true;
			} else {
				dashboard["gaming"] = false;
			}
			usercache["channel_details"] = dashboard;
			browser.storage.local.set({"API_USER" : usercache}, function() {
				updateDashboard(true);
			});
		} else if (data == "gameModeFail") {
			displayErrorMsg(102)
		} else if (data == "notAllowed") {
			displayNotificationMsg(5)
		}
	})
}
function setNsfw(value) {
	$.post("https://picarto.tv/process/dashboard", {setNsfw: value}, function(data) {
		if (data == "nsfwOk") {
			let dashboard = usercache["channel_details"];
			
			if (value == 1) {
				dashboard["adult"] = true;
			} else {
				dashboard["adult"] = false;
			}
			usercache["channel_details"] = dashboard;
			browser.storage.local.set({"API_USER" : usercache}, function() {
				updateDashboard(true);
			});
		} else if (data == "nsfwFail") {
			displayErrorMsg(103)
		} else if (data == "notAllowed") {
			displayNotificationMsg(5)
		} else if (data == "nsfwCategorySet") {
			displayNotificationMsg(36)
		}
	})
}
function setCommissionMode(value) {
	$.post("https://picarto.tv/process/dashboard", {setCommission: value}, function(data) {
		if (data == "commissionModeOk") {
			let dashboard = usercache["channel_details"];
			
			if (value == 1) {
				dashboard["commissions"] = true;
			} else {
				dashboard["commissions"] = false;
			}
			usercache["channel_details"] = dashboard;
			browser.storage.local.set({"API_USER" : usercache}, function() {
				updateDashboard(true);
			});
		} else if (data == "commissionModeFail") {
			displayErrorMsg(104)
		} else if (data == "notAllowed") {
			displayNotificationMsg(5)
		}
	})
}
function updateDashboard(c = false) {
	storage.local.get("API_USER", function(items) {
		
		if (!items["API_USER"]) {
			return;
		}
		
		if (c) {
			let cachestamp = Date.now();
			browser.storage.local.set({"CACHESTAMP" : cachestamp});
		}
		
		usercache = items["API_USER"];
		dashboard = usercache["channel_details"];
		
		if (dashboard) {
			if (dashboard["gaming"] == true) {
				$("#gamemode").addClass("on").off().on('click', function() {
					$("#gamemode").addClass("disabled").off();
					$("#gamemode").children().html("&#xe88d;");
					setGameMode(0);
				});
			} else {
				$("#gamemode").removeClass("on").off().on('click', function() {
					$("#gamemode").addClass("disabled").off();
					$("#gamemode").children().html("&#xe88d;");
					setGameMode(1);
				});;
			}
			$("#gamemode").removeClass("disabled");
			$("#gamemode").children().html("&#xe834;");
			if (dashboard["adult"] == true) {
				$("#nsfw").addClass("on").off().on('click', function() {
					$("#nsfw").addClass("disabled").off();
					$("#nsfw").children().html("&#xe88d;");
					setNsfw(0);
				});
			} else {
				$("#nsfw").removeClass("on").off().on('click', function() {
					$("#nsfw").addClass("disabled").off();
					$("#nsfw").children().html("&#xe88d;");
					setNsfw(1);
				});;
			}
			$("#nsfw").removeClass("disabled");
			$("#nsfw").children().html("&#xe800;");
			if (dashboard["commissions"] == true) {
				$("#commissions").addClass("on").off().on('click', function() {
					$("#commissions").addClass("disabled").off();
					$("#commissions").children().html("&#xe88d;");
					setCommissionMode(0);
				});
			} else {
				$("#commissions").removeClass("on").off().on('click', function() {
					$("#commissions").addClass("disabled").off();
					$("#commissions").children().html("&#xe88d;");
					setCommissionMode(1);
				});;
			}
			$("#commissions").removeClass("disabled");
			$("#commissions").children().html("&#xe88e;");
		}
	});
}

function updateAdvanced() {
	if (!settings.streamer || true) { // temp: no streamer mode
		$("#advanced").hide();
		$(".ms_inv").hide();
	} else {
		$("#advanced").show();
		if (token)
			$(".ms_inv").show();
		
		updateDashboard();
		
		// register the invite bar and button
		storage.local.get("API_USER", function(items) {
			if (items["API_USER"] && items["API_USER"]["channel_details"] && items["API_USER"]["channel_details"]["account_type"] == "premium") {
				$("#inviteBtn").off().on('click', function() {
					var name = $("#channelToInvite_txt").val();
					invite(name);
				});
				$("#channelToInvite_txt").off('keypress').on('keypress', function(vk) {
					if (vk.which == 13) {
						var name = $(this).val();
						invite(name);
					}
				});
				$("#invitebar").show();
			} else {
				$("#invitebar").hide();
			}
		});

		// loop through invite accept/decline/revoke buttons
		var decline = $('.ms_dec');
		decline.each(function() {
			var inv = $(this);
			var id = $(this).attr('value');
			
			// register the leave button
			$(this).off().on('click', function() {
				$.post("https://picarto.tv/process/settings/multistream", {type: "multistream", leaveMultistream: id}, function(data) {}, "json").done(function(data) {
					if (data.multistreamLeft == 1) {
						if (isDevMode()) {
							console.log("Refusing multistream...");
						}
						inv.parent().parent().parent().remove();
					}
				}).fail(function() {
					displayErrorMsg(223);
				});
			}).on('mouseover', function() {
				$(this).parent().parent().parent().css("background-color", "rgba(116, 57, 52, 0.95)")
			}).on('mouseout', function() {
				$(this).parent().parent().parent().css("background-color", "#5b616c")
			});
		});
		var accept = $('.ms_acc');
		accept.each(function() {
			var inv = $(this);
			var id = $(this).attr('value');
			
			// register the accept button
			$(this).off().on('click', function() {
				$.post("https://picarto.tv/process/settings/multistream", {type: "multistream", acceptInvitation: id}, function(data) {}, "json").done(function(data) {
					if (isDevMode()) {
						console.log("Accepting multistream...");
					}
					if (data.privatemode == 1) {
						displayNotificationMsg(33)
					} else {
						switch (data.invitationAccepted) {
							case 1:
								inv.parent().parent().parent().remove();
								break;
							case "alreadyAccepted":
								displayNotificationMsg(22);
								break;
							case "channelError":
								displayNotificationMsg(20);
								break;
							case "updateError":
								displayErrorMsg(225);
								break;
							default:
								displayErrorMsg(226);
						}
					}
				}).fail(function() {
					console.log("Whoops. it failed!");
				});
			}).on('mouseover', function() {
				$(this).parent().parent().parent().css("background-color", "rgba(95, 116, 52, 0.95)")
			}).on('mouseout', function() {
				$(this).parent().parent().parent().css("background-color", "#5b616c")
			});
		});
		var revoke = $('.ms_rev');
		revoke.each(function() {
			var inv = $(this);
			var id = $(this).attr('value');
			
			// register the uninvite button
			$(this).off().on('click', function() {
				$.post("https://picarto.tv/process/settings/multistream", {type: "multistream", removeMultistream: id}, function(data) {}, "json").done(function(data) {
					if (data.removed == 1) {
						if (isDevMode()) {
							console.log("Revoking session...");
						}
						inv.parent().parent().parent().remove();
					}
				}).fail(function() {
					displayErrorMsg(224);
				});
			}).on('mouseover', function() {
				$(this).parent().parent().parent().css("background-color", "rgba(116, 57, 52, 0.95)")
			}).on('mouseout', function() {
				$(this).parent().parent().parent().css("background-color", "#5b616c")
			});
		});
		var invit = $('.ms_inv');
		invit.each(function() {
			var name = $(this).attr('value');
			
			// register the invite button on each streamer's name
			$(this).off().on('mouseover', function() {
				$(this).parent().parent().css("background-color", "rgba(116, 57, 52, 0.95)")
			}).on('mouseout', function() {
				$(this).parent().parent().css("background-color", "")
			}).click(function(event) {
				$(this).children().html("&#xe88d;");
				$(this).addClass("disabled");
				event.stopPropagation();
				invite(name);
			});
		});
	}
}

function invite(name) {
			if (name.length > 0 && name.length <= 24) {
				if (name.toLowerCase() != ownname.toLowerCase()) {
					//clearMessages();
					$("#channelToInvite_txt").prop('disabled', true);
					$("#inviteBtn").off();
					$.post("https://picarto.tv/process/settings/multistream", {type: "multistream", channelToInvite: name}, function(data) {}, "json").done(function(data) {
						$("#channelToInvite_txt").prop('disabled', false);
						
						$(".ms_inv").children().html("&#xe814;");
						$(".ms_inv").removeClass("disabled");
						
						$("#inviteBtn").off().on('click', function() {
							var name = $("#channelToInvite_txt").val();
							invite(name);
						});
						if (data.privatemode == 1) {
							displayNotificationMsg(33);
						} else {
							switch (data.update) {
								case 1:
									appendMultiCard(name, data.userIdFromInvitedChannel, "outgoing");
									break;
								case "alreadyInvited":
									displayNotificationMsg(19);
									break;
								case "selfInvited":
									displayNotificationMsg(18);
									break;
								case "channelNotFound":
									displayNotificationMsg(20);
									break;
								case "maxInvReached":
									displayNotificationMsg(17);
									break;
								case "guestOrHost":
									displayNotificationMsg(22);
									break;
								case "error":
									displayErrorMsg(230);
									break;
								default:
									if (usercache["channel_details"]["account_type"] && usercache["channel_details"]["account_type"] != "premium")
										displayNotificationMsg(74);
									else
										displayErrorMsg(231);
									break
							}
						}
					}).fail(function() {
						displayErrorMsg(219);
					});
				} else {
					displayNotificationMsg(18);
				}
			} else {
				displayNotificationMsg(21);
			}
		}

// main update function
function update() {
	
	if (notifcache[0]) {
		$('#notif_badge').show();
		$('#notif_badge').text(notifcache.length);
	}
	else
		$('#notif_badge').hide();
	
	multistream = false;
	
	storage.local.get("ERROR", function(items) {
		err = items["ERROR"];
		
		$('#con_live').hide();
		$('#con_advanced').hide();
		
		switch (err) {
			case 0:
				$('#con_live').show();
				$('#con_advanced').show();
				
				updateLive(()=>{
					updateMulti(()=>{
						updateAdvanced();
					});
				});
				updateMulti();
				updateNotifications();
				updateRecordings();
				
				break;
			case 1:
				$('#con_headings').text("Token expired!\nLog into any channel to refresh.");
				break;
			case 2:
				$('#con_headings').text("User not logged in! Please log in to Picarto.tv to use this.");
			default:
				$('#con_headings').text("Uknown error: " + err);
				break;
		}
	});
	
	if (token) {
		$(".dashboard-enabled").show();
		$(".dashboard-disabled").hide();
	}
	else {
		$(".dashboard-enabled").hide();
		$(".dashboard-disabled").show();
	}
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

function toggleSetting(s, cond) {
	let o = $("#" + s);
	o.prop('disabled', cond);
	/* if (!cond)
		o.parent().show();
	else
		o.parent().hide(); */
}
function toggleChildSettings() {
	toggleSetting("alert", !settings.notifications);
	/* toggleSetting("dingvolume", !settings.notifications || !settings.alert); */
	toggleSetting("badgenotif", settings.picartobar);
	toggleSetting("picartobar", settings.badgenotif);
}

function startup(callback) {
	
	storage.sync.get(["SETTINGS"], (data) => {
		for (s in data["SETTINGS"]) {
			settings[s] = data["SETTINGS"][s];
		}
		
		for (s in settings) {
			let obj = $("#" + s);
			if(obj.attr("type") === "checkbox") {
				obj[0].checked = settings[s];
			} else {
				obj.val(settings[s]);
			}
		}
		
		toggleChildSettings();
		
		storage.sync.get(["RECENTNAMES"], (data) => {
			if(data["RECENTNAMES"])
				recentnames = data["RECENTNAMES"];
		});
	});
	
	storage.local.get(["OAUTH"], (data) => {
		if(data["OAUTH"]) {
			token = data["OAUTH"];
			$("#oauthtoken").val(token);
		}
	});
}
function saveSetting(s) {
	let obj = $("#" + s);
	if (obj.attr("type") === "checkbox")
		settings[s] = obj[0].checked;
	else
		settings[s] = obj.val();
	storage.sync.set({"SETTINGS" : settings}, function() {
		
		let msg = {"message" : "settingChanged"};
		msg[s] = settings[s];
		browser.runtime.sendMessage(msg);
		
		toggleChildSettings();
		
		if(!browser.runtime.lastError){
			console.log('Saved', ticket, contents);
		} 
		
		console.log("Settings updated!");
		
		
		/* storage.sync.get(["SETTINGS"], (data) => {
			console.log(data["SETTINGS"]);
		}); */
	});
	
	
}

// setup popup window
$(document).ready(function() {
	
	initSettings(function() {
		if (isDevMode()) {
			console.log("SETTINGS LOADED!");
		}
		
		// register autocompletion
		var predictable = $('#channelToInvite_txt')[0];
		$('#channelToInvite_txt').emailautocomplete({
			//suggClass: "custom-classname", //default: "eac-sugg". your custom classname (optional)
			domains: recentnames //additional domains (optional)
		});
		
		// register color picker
		$('#badgecolor').colorPicker({
			onColorChange : function(id, newValue) {
				/* console.log("ID: " + id + " has been changed to " + $("#badgecolor").val()); */
				saveSetting("badgecolor");
			}
		});
		
		// setup navbar
		$(".side_btn").on("click", function() {
			$(".side_btn").removeClass("active");
			$(".tab").removeClass("active");
			$("." + $(this).attr('id')).addClass("active");
		});
		
		if(settings.badgenotif)
			$(".t_notifications").addClass("active");
		else
			$(".t_main").addClass("active");
		
		// register settings buttons
		for (s in settings) {
			let setting = s;
			if (s == "badgecolor")
				continue;
			let obj = $("#" + s);
			if (obj.attr("type") == "number" || obj.attr("type") == "text") {
				obj.on("input", function() {
					saveSetting(setting);
				});
			}
			else {
				obj.on("click", function() {
					saveSetting(setting);
				});
			}
		}
		
		// register OAuth override box
		$("#oauthhidden").hide();
		$("#oauthshow").on("click", function() {
			$("#oauthhidden").toggle();
		});
		$("#oauthconfirm").on("click", function() {
			token = $("#oauthtoken").val();
			storage.local.set({"OAUTH" : token});
			
			$("#oauthconfirm").addClass("clicked");
			setTimeout(function() {
				$("#oauthconfirm").removeClass("clicked");
			}, 100);
		});
		
		// register streamer mode button
		$("#streamer").on("click", function() {
			saveSetting("streamer");
			updateAdvanced();
		});
		updateAdvanced();
		
		// register notification purge button
		$("#removeall").on("click", function() {
			if (notifcache[0]) {
				for (n in notifcache) {
					postAPI("user/notifications/" + notifcache[n]["uuid"] + "/delete");
				}
				notifcache = {};
				storage.local.set({"API_NOTIFICATIONS" : notifcache});
				$('#con_notifications').empty();
				let cachestamp = Date.now();
				browser.storage.local.set({"CACHESTAMP" : cachestamp});
			}
		});
		
		// register OAuth connection button
		$(".oauth_connect").on("click", function() {
			let msg = {"message" : "oauth"};
			browser.runtime.sendMessage(msg, function(r) {
				$(".dashboard-enabled").show();
				$(".dashboard-disabled").hide();
				$(".ms_inv").show();
				getSettings();
			});
		});
		$(".oauth_manual").on("click", function() {
			$(".side_btn").removeClass("active");
			$(".tab").removeClass("active");
			$(".t_settings").addClass("active");
			$("#oauthshow")[0].checked = true;
			setTimeout(function() { $("#oauthtoken").get(0).focus(); }, 100);
			$("#oauthhidden").show();
			$("#oauthhidden").addClass("clicked");
			setTimeout(function() {
				$("#oauthhidden").removeClass("clicked");
			}, 500);
		});
		
		// register Purge Settings button
		$("#purge").on("click", function() {
			storage.local.clear();
			storage.sync.clear();
			getSettings();
			let msg = {"message" : "purgeAll"};
			browser.runtime.sendMessage(msg);
			$(".colorPicker-picker").css("background-color", "#33aa33")
			
			recentnames = [];
			peoplelive = false;
			multistream = false;
			token = "";
			ownname = "";

			livecache = {};
			multicache = {};
			usercache = {};
			notifcache = {};
			recordcache = {};

			$(".dashboard-enabled").hide();
			$(".dashboard-disabled").show();
		});
		
		// get app version
		var manifestData = browser.runtime.getManifest();
		$("#version").text("ver " + manifestData.version);
		
		
		
		startup();
		if (isDevMode()) {
			console.log("STARTUP!");
		}
		
		update();
		var updater = setInterval(update, 1000);
	});
});
















