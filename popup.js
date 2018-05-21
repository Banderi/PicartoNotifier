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

// main update function
function updateNames() {
	
	var streaming = false;
	var multistream = false;
	
	storage.local.get(null, function(items) {
		$('body').find('.con_live').empty();
		$('body').find('.con_invites').empty();
	
		var keys = Object.keys(items);
		keys.forEach(function(key, index) {
		
			if (key == "USERNAME" || key == "SETTINGS") {
				//ownname = items[key];
			}
			else if (key == "MULTISTREAM_SESSION") {
				if (items[key][0] && settings["streamer"] == true) {
					multistream = true;
					
					// add invites
					for (index in items[key]) {
						
						var found = jQuery.inArray(items[key][index]["name"], settings["recentnames"]);
						if (found >= 0) {
							// name already present
						} else {
							settings["recentnames"].push(items[key][index]["name"]);
						}
						//var r = JSON.stringify(rec);
						storage.local.set({"SETTINGS" : settings}, function() {
							localStorage["SETTINGS"] = JSON.stringify(settings); // save backup data in localStorage
						});
						
						// received pending invite
						if (items[key][index]["status"] == "received") { 
							$('body').find('.con_invites').append(
								$('<div/>', {'class': 'conn_invite'}).append(
									$('<div/>', {'class': 'conn_streamer_head'}).append(
										$('<div/>', {'class': 'col'}).append(
											$('<img/>', {'class': 'conn_avatar'}).attr("src", "https://picarto.tv/user_data/usrimg/" + items[key][index]["name"].toLowerCase() + "/dsdefault.jpg")
										)
										.append(
											$('<span/>', {'class': 'conn_user', text: "Invite from " + items[key][index]["name"]})
										)
										.append(
											$('<span/>', {'class': 'ms_button ms_acc', 'title': 'Accept invite', 'value': items[key][index]["id"]}).append(
												$('<i/>', {'class': 'icon'}).html('&#xe812;')
											)
										)
										.append(
											$('<span/>', {'class': 'ms_button ms_dec', 'title': 'Decline invite', 'value': items[key][index]["id"]}).append(
												$('<i/>', {'class': 'icon'}).html('&#xe813;')
											)
										)
									)
								)
							);
						}
						// attending multistream session
						else if (items[key][index]["status"] == "attending") {
							$('body').find('.con_invites').append(
								$('<div/>', {'class': 'conn_invite'}).append(
									$('<div/>', {'class': 'conn_streamer_head'}).append(
										$('<div/>', {'class': 'col'}).append(
											$('<img/>', {'class': 'conn_avatar'}).attr("src", "https://picarto.tv/user_data/usrimg/" + items[key][index]["name"].toLowerCase() + "/dsdefault.jpg")
										)
										.append(
											$('<span/>', {'class': 'conn_user', text: items[key][index]["name"]})
										)
										.append(
											$('<span/>', {'class': 'ms_button ms_dec', 'title': 'Leave session', 'value': items[key][index]["id"]}).append(
												$('<i/>', {'class': 'icon'}).html('&#xe813;')
											)
										)
									)
								)
							);
						}
						// sent pending invite
						else if (items[key][index]["status"] == "sent") {
							$('body').find('.con_invites').append(
								$('<div/>', {'class': 'conn_invite'}).append(
									$('<div/>', {'class': 'conn_streamer_head'}).append(
										$('<div/>', {'class': 'col'}).append(
											$('<img/>', {'class': 'conn_avatar'}).attr("src", "https://picarto.tv/user_data/usrimg/" + items[key][index]["name"].toLowerCase() + "/dsdefault.jpg")
										)
										.append(
											$('<span/>', {'class': 'conn_user', text: "Awaiting..."})
										)
										.append(
											$('<span/>', {'class': 'ms_button ms_rev', 'title': 'Cancel invite', 'value': items[key][index]["id"]}).append(
												$('<i/>', {'class': 'icon'}).html('&#xe813;')
											)
										)
									)
								)
							);
						}
						// hosting multistream session
						else if (items[key][index]["status"] == "hosting") {
							$('body').find('.con_invites').append(
								$('<div/>', {'class': 'conn_invite'}).append(
									$('<div/>', {'class': 'conn_streamer_head'}).append(
										$('<div/>', {'class': 'col'}).append(
											$('<img/>', {'class': 'conn_avatar'}).attr("src", "https://picarto.tv/user_data/usrimg/" + items[key][index]["name"].toLowerCase() + "/dsdefault.jpg")
										)
										.append(
											$('<span/>', {'class': 'conn_user', text: "Accepted!"})
										)
										.append(
											$('<span/>', {'class': 'ms_button ms_rev', 'title': 'Revoke invite', 'value': items[key][index]["id"]}).append(
												$('<i/>', {'class': 'icon'}).html('&#xe813;')
											)
										)
									)
								)
							);
						}
						
					}
				}
			}
			else if (items[key]) {
				streaming = true;
				
				if (isDevMode()) {
					console.log("account type: " + settings["account"]);
				}
				
				var found = jQuery.inArray(key, settings["recentnames"]);
				if (found >= 0) {
					// name already present
				} else {
					settings["recentnames"].push(key);
				}
				//var r = JSON.stringify(rec);
				storage.local.set({"SETTINGS" : settings}, function() {
					localStorage["SETTINGS"] = JSON.stringify(settings); // save backup data in localStorage
				});
				
				
				// add link to the window				
				if (settings["account"] == "premium") {
					$('body').find('.con_live').append(
						$('<div/>', {'class': 'conn_streamer', 'id': key}).append(
							$('<div/>', {'class': 'conn_streamer_head'}).append(
								$('<div/>', {'class': 'col'}).append(
									$('<img/>', {'class': 'conn_avatar'}).attr("src", "https://picarto.tv/user_data/usrimg/" + key.toLowerCase() + "/dsdefault.jpg")
								)
								.append(
									$('<span/>', {'class': 'conn_user', text: key})
								)
								.append(
									$('<span/>', {'class': 'ms_button ms_inv', 'title': 'Invite to multistream', 'value': key}).append(
										$('<i/>', {'class': 'icon'}).html('&#xe814;')
									)
								)
							)
						)
					);
				} else {
					$('body').find('.con_live').append(
						$('<div/>', {'class': 'conn_streamer', 'id': key}).append(
							$('<div/>', {'class': 'conn_streamer_head'}).append(
								$('<div/>', {'class': 'col'}).append(
									$('<img/>', {'class': 'conn_avatar'}).attr("src", "https://picarto.tv/user_data/usrimg/" + key.toLowerCase() + "/dsdefault.jpg")
								)
								.append(
									$('<span/>', {'class': 'conn_user', text: key})
								)
							)
						)
					);
				}
			}
		});
		if (streaming) {
			$('body').find('.con_headings').text("Currently streaming:");
			$('body').find('.con_live').show();
		}
		// loop through links
		var links = $('body').find('.conn_streamer');
		if (isDevMode()) {
			console.log("links are: " + links.length);
		}
		links.each(function() {
			var name = $(this).attr('id');
			if (isDevMode()) {
				console.log($(this) + " : " + name);
			}
			
			// register the link
			document.getElementById(name).addEventListener('click', function() {
				openStreamer(name);
			});
		});
		
		// streamer advanced mode!
		if (settings["streamer"] == true) {
			if (isDevMode()) {
				console.log("(Streamer mode is enabled.)");
			}
			$("#advanced").show();
			
			if (settings["account"] == "premium") {
				$("#invitebar").show();
			} else {
				$("#invitebar").hide();
			}
			
			// register dashboard buttons
			function setGameMode(value) {
				$.post("https://picarto.tv/process/dashboard", {setGameMode: value}, function(data) {
					if (data == "gameModeOk") {
						storage.local.get("SETTINGS", function(items) {
							if (items["SETTINGS"]) {
								settings = items["SETTINGS"];
							} else if (localStorage["SETTINGS"]) {
								settings = JSON.parse(localStorage["SETTINGS"]); // get backup data from localStorage
							}
							if (settings["dashboard"]) {
								dashboard = settings["dashboard"];
							}
							
							if (value == 1) {
								dashboard["gamingmode"] = true;
							} else {
								dashboard["gamingmode"] = false;
							}
							settings["dashboard"] = dashboard;
							browser.storage.local.set({"SETTINGS" : settings}, function() {
								localStorage["SETTINGS"] = JSON.stringify(settings); // save backup data in localStorage
								updateDashboard();
							});
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
						storage.local.get("SETTINGS", function(items) {
							if (items["SETTINGS"]) {
								settings = items["SETTINGS"];
							} else if (localStorage["SETTINGS"]) {
								settings = JSON.parse(localStorage["SETTINGS"]); // get backup data from localStorage
							}
							if (settings["dashboard"]) {
								dashboard = settings["dashboard"];
							}
							
							if (value == 1) {
								dashboard["nsfw"] = true;
							} else {
								dashboard["nsfw"] = false;
							}
							settings["dashboard"] = dashboard;
							browser.storage.local.set({"SETTINGS" : settings}, function() {
								localStorage["SETTINGS"] = JSON.stringify(settings); // save backup data in localStorage
								updateDashboard();
							});
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
						storage.local.get("SETTINGS", function(items) {
							if (items["SETTINGS"]) {
								settings = items["SETTINGS"];
							} else if (localStorage["SETTINGS"]) {
								settings = JSON.parse(localStorage["SETTINGS"]); // get backup data from localStorage
							}
							if (settings["dashboard"]) {
								dashboard = settings["dashboard"];
							}
							
							if (value == 1) {
								dashboard["commissions"] = true;
							} else {
								dashboard["commissions"] = false;
							}
							settings["dashboard"] = dashboard;
							browser.storage.local.set({"SETTINGS" : settings}, function() {
								localStorage["SETTINGS"] = JSON.stringify(settings); // save backup data in localStorage
								updateDashboard();
							});
						});
						// var dashb = JSON.parse(localStorage["dashboard"]);
						// if (value == 1) {
							// dashb["commissions"] = true;
						// } else {
							// dashb["commissions"] = false;
						// }
						// localStorage["dashboard"] = JSON.stringify(dashb);
					} else if (data == "commissionModeFail") {
						displayErrorMsg(104)
					} else if (data == "notAllowed") {
						displayNotificationMsg(5)
					}
					//updateDashboard();
				})
			}
			function updateDashboard() {
			
				storage.local.get("SETTINGS", function(items) {
					if (items["SETTINGS"]) {
						settings = items["SETTINGS"];
					} else if (localStorage["SETTINGS"]) {
						settings = JSON.parse(localStorage["SETTINGS"]); // get backup data from localStorage
					}
					if (settings["dashboard"]) {
						dashboard = settings["dashboard"];
					}
					
					if (dashboard) {
						if (dashboard["gamingmode"] == true) {
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
						if (dashboard["nsfw"] == true) {
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
			updateDashboard();
			
			// register the invite bar and button
			function invite(name) {
				if (name.length > 0 && name.length <= 24) {
					if (name.toLowerCase() != settings["ownname"].toLowerCase()) {
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
										$('body').find('.con_invites').append(
											$('<div/>', {'class': 'conn_invite'}).append(
												$('<div/>', {'class': 'conn_streamer_head'}).append(
													$('<div/>', {'class': 'col'}).append(
														$('<img/>', {'class': 'conn_avatar'}).attr("src", "https://picarto.tv/user_data/usrimg/" + name.toLowerCase() + "/dsdefault.jpg")
													)
													.append(
														$('<span/>', {'class': 'conn_user', text: "Pending..."})
													)
													.append(
														$('<span/>', {'class': 'ms_button ms_rev', 'value': data.userIdFromInvitedChannel}).append(
															$('<i/>', {'class': 'icon'}).html('&#xe813;')
														).off().on('click', function() {
															var inv = $(this);
															$.post("https://picarto.tv/process/settings/multistream", {type: "multistream", removeMultistream: data.userIdFromInvitedChannel}, function(data) {}, "json").done(function(data) {
																if (data.removed == 1) {
																	if (isDevMode()) {
																		console.log("Revoking session...");
																	}
																	inv.parent().parent().parent().remove();
																	//clearInterval(updater);
																	//var updater = setInterval(updateNames, 5000);
																	storage.local.get("MULTISTREAM_SESSION", function(items) {
																		for (index in items["MULTISTREAM_SESSION"]) {
																			if (items["MULTISTREAM_SESSION"][index]["id"] == data.userIdFromInvitedChannel) {
																				delete(items["MULTISTREAM_SESSION"][index]);
																				storage.local.set({"MULTISTREAM_SESSION":items["MULTISTREAM_SESSION"]}, function() {
																					browser.runtime.sendMessage( {message: "updateAll"} );
																				});
																			}
																		}
																	});
																}
															}).fail(function() {
																displayErrorMsg(224);
															});
														}).on('mouseover', function() {
															$(this).parent().parent().parent().css("background-color", "rgba(116, 57, 52, 0.95)")
														}).on('mouseout', function() {
															$(this).parent().parent().parent().css("background-color", "#5b616c")
														})
													)
												)
											)
										);
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
			
			if (multistream) {
				//$('body').find('.con_multi').text("Current multistream sessions:");
				//$('body').find('.con_invites').show();
			}
			// loop through invite accept/decline/revoke buttons
			var decline = $('body').find('.ms_dec');
			decline.each(function() {
				var inv = $(this);
				var id = $(this).attr('value');
				if (isDevMode()) {
					console.log($(this).parent().children().eq(1).text() + " : " + id);
				}
				
				// register the leave button
				$(this).off().on('click', function() {
					$.post("https://picarto.tv/process/settings/multistream", {type: "multistream", leaveMultistream: id}, function(data) {}, "json").done(function(data) {
						if (data.multistreamLeft == 1) {
							if (isDevMode()) {
								console.log("Refusing multistream...");
							}
							inv.parent().parent().parent().remove();
							//clearInterval(updater);
							//var updater = setInterval(updateNames, 5000);
							storage.local.get("MULTISTREAM_SESSION", function(items) {
								for (index in items["MULTISTREAM_SESSION"]) {
									if (items["MULTISTREAM_SESSION"][index]["id"] == id) {
										delete(items["MULTISTREAM_SESSION"][index]);
										storage.local.set({"MULTISTREAM_SESSION":items["MULTISTREAM_SESSION"]}, function() {
											browser.runtime.sendMessage( {message: "updateAll"} );
										});
									}
								}
							});
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
			var accept = $('body').find('.ms_acc');
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
									//clearInterval(updater);
									//var updater = setInterval(updateNames, 5000);
									storage.local.get("MULTISTREAM_SESSION", function(items) {
										for (index in items["MULTISTREAM_SESSION"]) {
											if (items["MULTISTREAM_SESSION"][index]["id"] == id) {
												delete(items["MULTISTREAM_SESSION"][index]);
												storage.local.set({"MULTISTREAM_SESSION":items["MULTISTREAM_SESSION"]}, function() {
													browser.runtime.sendMessage( {message: "updateAll"} );
												});
											}
										}
									});
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
			var revoke = $('body').find('.ms_rev');
			revoke.each(function() {
				var inv = $(this);
				var id = $(this).attr('value');
				if (isDevMode()) {
					console.log($(this).parent().children().eq(1).text() + " : " + id);
				}
				
				// register the uninvite button
				$(this).off().on('click', function() {
					$.post("https://picarto.tv/process/settings/multistream", {type: "multistream", removeMultistream: id}, function(data) {}, "json").done(function(data) {
						if (data.removed == 1) {
							if (isDevMode()) {
								console.log("Revoking session...");
							}
							inv.parent().parent().parent().remove();
							//clearInterval(updater);
							//var updater = setInterval(updateNames, 5000);
							storage.local.get("MULTISTREAM_SESSION", function(items) {
								for (index in items["MULTISTREAM_SESSION"]) {
									if (items["MULTISTREAM_SESSION"][index]["id"] == id) {
										delete(items["MULTISTREAM_SESSION"][index]);
										storage.local.set({"MULTISTREAM_SESSION":items["MULTISTREAM_SESSION"]}, function() {
											browser.runtime.sendMessage( {message: "updateAll"} );
										});
									}
								}
							});
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
			var invit = $('body').find('.ms_inv');
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
		else {
			if (isDevMode()) {
				console.log("(Streamer mode is disabled.)");
			}
			$("#con_advanced").hide();
		}
	});
}

// get default settings or fetch from storage
let defaults = {
	"dashboard" : {},
	"ownname" : "",
	"recentnames" : [],
	"account" : "free",
	"streamer" : false
};

var settings = defaults;

storage.local.get(["SETTINGS"], (data) => {
	for (let a in data["SETTINGS"]) {
		let setting = data["SETTINGS"][a];
		settings[a] = setting;
	}
})

// update popup window
$(document).ready(function() {
	updateNames();
	//clearInterval(updater);
	var updater = setInterval(updateNames, 5000);
	
	var predictable = $('#channelToInvite_txt')[0];
	$('#channelToInvite_txt').emailautocomplete({
		//suggClass: "custom-classname", //default: "eac-sugg". your custom classname (optional)
		domains: settings["recentnames"] //additional domains (optional)
	});
	
	if (isDevMode()) {
		console.log("updated!");
	}
});