function pick (sourceObject, keys) {
    var newObject = {};
    keys.forEach(function(key) { newObject[key] = sourceObject[key]; });
    return newObject;
}

function groupBy(collection, f) {
    let r = {};
    for (let e of collection) {
        const key = f(e);
        if (!(key in r)) r[key] = [];
        r[key].push(e);
    }
    return r;
}

function setCookie(c) {
    var cs = JSON.stringify(c);
    if (self.port) {
	self.port.emit("setCookie", cs);
    }
}

function removeIt(c, that) {
    browser.cookies.remove(pick(c, ['name', 'url']));
    that.parentElement.parentElement.style.visibility = 'hidden';
}

function modifyIt(c, that, event) {
    console.log("modifyIt");
    c.value = that.value;
    browser.cookies.set(pick(c, ['url', 'name', 'value', 'domain', 'path', 'secure', 'httpOnly', 'expirationDate', 'storeId']));
    event.preventDefault();    
}

function textNode(text) {
    return document.createTextNode(text);
}

function addCSS(css) {
    let elt = createElement('style', [textNode(css)]);
    elt.setAttribute("type", 'text/css');
    document.body.appendChild(elt);
}

function createElement(tag, children, attrs) {
    let elt = document.createElement(tag);
    children.forEach(e => elt.appendChild(e));
    if (attrs) {
    	Object.keys(attrs).forEach(function (k) {
	        elt[k] = attrs[k];
	    });
    }
    return elt;
}

function cookieLine(c) {
    let del = createElement("img", [], {
        width: "20", alt: "del", src: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Page-delete.png?uselang=fr",
        onclick: function () { removeIt(c, del) },
    });

    let input = createElement("input", [], { name: "val", value: c.value });
    let form = createElement("form", [input], {
        onsubmit: function(event) { return modifyIt(c, input, event); },
    });
    
    let tr = createElement("tr", [
        //createElement("td", [textNode(c.host)]),
        createElement("td", [del]),
        createElement("td", [textNode(c.name)], { className: 'cookieName' }),
        createElement("td", [form]),
        createElement("td", c.path === '/' ? []: [textNode(c.path)]),
    ]);
    return tr;
}

function showCookiesForTabRaw(tab) {
  browser.cookies.getAll({url: tab.url}).then((cookies) => {
    let cookieList = document.getElementById('cookie-list');

    for (let c of cookies) c.url = tab.url;
    
    let byDomain = groupBy(cookies, c => c.hostOnly ? '' : c.domain);
    Object.keys(byDomain).sort().forEach(domain => {
        let trs = byDomain[domain].map(cookieLine);
        cookieList.appendChild(createElement("p", [textNode((domain || 'App') + ' cookies:')]));
        cookieList.appendChild(createElement("table", trs));
    });
  });
}

//get active tab to run an callback function.
//it sends to our callback an array of tab objects
function getActiveTab() {
  return browser.tabs.query({currentWindow: true, active: true});
}
getActiveTab().then(tabs => showCookiesForTabRaw(tabs.pop()));
