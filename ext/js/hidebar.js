if (chrome) {
	storage = chrome.storage;
	tabs = chrome.tabs;
	notifications = chrome.notifications;
	browser = chrome;
}
function isDevMode() {
    return !('update_url' in browser.runtime.getManifest());
}

// get default settings or fetch from storage
let defaults = {
	"picartobar" : true,
	"streamer" : false
};

var settings = defaults;
var updater;

storage.local.get("SETTINGS", (data) => {	
	for (let a in data["SETTINGS"]) {
		let setting = data["SETTINGS"][a];
		settings[a] = setting;
	}
});

function update() {
	if (settings["streamer"] == true && false) {	// thanks for breaking this, Picarto
		if (isDevMode()) {
			/* console.log("Fetching multistream data..."); */
		}
		
		var ownname = $(".usermenu_top").children().eq(1).text();
		if (ownname != "")
			storage.local.set({"USERNAME":ownname});
		
		var parse;
		var invites = {};
		var index = 0
		
		parse = $("multistream-invitation-incoming");
		if (parse.length != 0) {
			parse.each(function(i) {
				var id = $(this).attr('uid');
				var acc = $(this).attr('accepted');
				var name = $(this).attr('channel');
				var status = "received";
				
				if (acc == "true")
					status = "attending";
				
				var invite_element = {"name" : name, "id" : id, "status" : status};
				invites[index] = invite_element;
				
				index++;
			});
		}
		parse = $("multistream-invitation-outgoing");
		if (parse.length != 0) {
			parse.each(function(i) {
				var id = $(this).attr('uid');
				var acc = $(this).attr('accepted');
				var name = $(this).attr('channel');
				var status = "sent";
				
				if (acc == "true")
					status = "hosting";
				
				var invite_element = {"name" : name, "id" : id, "status" : status};
				invites[index] = invite_element;
				
				index++;
			});
		}
		
		if($("multistream-modal").parent().length != 0)
			storage.local.set({"MULTISTREAM_SESSION":invites});
	}
	
	if (settings["picartobar"] == true) {
		var s = $("#hideNotifications");
		if (s.parent().length != 0)
			s[0].click();
	}
}

update();
var updater = setInterval(update, 1000);