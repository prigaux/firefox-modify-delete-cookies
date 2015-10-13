function removeCookie(c) {
    var cs = JSON.stringify(c);
    if (self.port) {
	self.port.emit("removeCookie", cs);
    }
}

function setCookie(c) {
    var cs = JSON.stringify(c);
    if (self.port) {
	self.port.emit("setCookie", cs);
    }
}

function removeIt(c, that) {
    console.log("removing   " + c.name + "    (" + c.host + ")");
    removeCookie(c);
    that.parentElement.parentElement.style.visibility = 'hidden';
}

function modifyIt(c, that) {
    c.value = that.value;
    console.log("setting cookie   " + c.name + " = " + c.value + "    (" + c.host + ")");
    setCookie(c);
    return false;
}

function textNode(text) {
    return document.createTextNode(text);
}

function addCSS(css) {
    var elt = createElement('style', [textNode(css)]);
    elt.setAttribute("type", 'text/css');
    document.body.appendChild(elt);
}

function createElement(tag, children, attrs) {
    var elt = document.createElement(tag);
    children.forEach(function (e) {
	elt.appendChild(e);
    });
    if (attrs) {
	Object.keys(attrs).forEach(function (k) {
	    elt[k] = attrs[k];
	});
    }
    return elt;
}

// remove everything, including existing css
document.head.innerHTML = '';
document.body.innerHTML = '';

addCSS(`
 .cookieName { max-width: 10em; overflow: hidden; }
 input { width: 40em; }
 form { margin-bottom: 0 }
`);

function createTable(cookies) {
    var trs = cookies.map(function (c_, i) {
	var c = c_;
	var del = createElement("img", [], {
	    width: "20", alt: "del", src: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Page-delete.png?uselang=fr",
	    onclick: function () { removeIt(c, del) },
	});

	var input = createElement("input", [], { name: "val", value: c.value });
	var form = createElement("form", [input], {
	    onsubmit: function() { return modifyIt(c, input); },
	});
	
	return createElement("tr", [
	    //createElement("td", [textNode(c.host)]),
	    createElement("td", [del]),
	    createElement("td", [textNode(c.name)], { className: 'cookieName' }),
	    createElement("td", [form]),
	]);
    });
    var table = createElement("table", trs);
    document.body.appendChild(table);
}

document.body.appendChild(createElement("p", [textNode("App cookies:")]));
createTable(self.options.cookies.app);
document.body.appendChild(createElement("p", [textNode("Domain cookies:")]));
createTable(self.options.cookies.domain);


