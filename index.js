let buttons = require('sdk/ui/button/action');
let tabs = require("sdk/tabs");
let self = require("sdk/self");
let url = require("sdk/url");
let {Hotkey} = require("sdk/hotkeys");

let {Cc, Ci} = require("chrome");

let cookieManager = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2);
let consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

const hotkey = "Control-F12";
buttons.ActionButton({
    id: "firefox-modify-delete-cookies-btn",
    label: "Modify/Delete cookies (" + hotkey + ")",
    icon: self.data.url("icon.svg"),
    onClick: doIt,
});

Hotkey({ combo: hotkey, onPress: doIt });

function getCookiesRaw(host) {
    let r = [];
    let l = cookieManager.getCookiesFromHost(host);
    while (l.hasMoreElements()) {
	r.push(l.getNext().QueryInterface(Ci.nsICookie2));
    }
    return r;
}

function getCookies(host, path) {
    let r = [];
    let r_domain = [];

    let domain = host.replace(/[^.]*/, '');
    
    getCookiesRaw(host).forEach(cookie => {
        if (!path.startsWith(cookie.path)) return;
	if (cookie.host === host || cookie.host === "."+host) {
	    r.unshift(cookie);
	} else if (cookie.host === domain) { // getCookiesFromHost is buggy, ignore cookies not matching nor host nor domain
	    r_domain.unshift(cookie);
	}
    });
    return { app: r, domain : r_domain };
}

function doIt() {
    let tab = tabs.activeTab;
    let host = url.URL(tab.url).host;
    let path = url.URL(tab.url).path;

    let worker = tab.attach({
	contentScriptFile: self.data.url("inside.js"),
	contentScriptOptions: {cookies: getCookies(host, path)}
    });
    worker.port.on("removeCookie", message => {
	let cookie = JSON.parse(message);
	cookieManager.remove(cookie.host, cookie.name, cookie.path, false);	
    });
    worker.port.on("setCookie", message => {
	let cookie = JSON.parse(message);
	if (cookie.isSession) cookie.expires = 9999999999; // workaround nsICookieManager2.add not handling isSession:true & expires:0
	cookieManager.add(cookie.host, cookie.path, cookie.name, cookie.value, cookie.isSecure, cookie.isHttpOnly, cookie.isSession, cookie.expires);
    });

}
