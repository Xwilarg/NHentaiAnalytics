function LoadFavorites(callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                if (this.responseText.includes("Abandon all hope, ye who enter here")) {
                    callback(undefined); // Not logged in
                } else {
                    LoadFavoritePage(1, [], callback);
                }
            } else {
                console.error("Error while loading doujinshi count (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/", true);
    http.send();
}

function LoadFavoritePage(pageNumber, doujinshis, callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let currDoujinshis = [];
                let matchs = /<a href="\/g\/([0-9]+)\/".+img src="([^"]+)".+<div class="caption">([^<]+)<\/div>/g; // Get all doujinshis
                do {
                    match = matchs.exec(this.responseText);
                    if (match !== null) {
                        currDoujinshis.push(new Doujinshi(match[1], match[2], match[3]));
                    }
                } while (match);
                if (currDoujinshis.length > 0) {
                    LoadFavoritePage(pageNumber + 1, doujinshis.concat(currDoujinshis), callback);
                } else {
                    StoreDoujinshis("[" + doujinshis.map(function(d) {
                        return JSON.stringify(d);
                    }).toString() + "]");
                    chrome.storage.sync.set({
                        doujinshiCount: doujinshis.length
                    });
                    callback(doujinshis.length);
                    StoreTags(doujinshis, 0);
                }
            } else {
                console.error("Error while loading favorites page " + pageNumber + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/?page=" + pageNumber, true);
    http.send();
}

function StoreTags(doujinshis, index) { // We wait 500 ms before checking each page so the API doesn't return a 50X error
    setTimeout(function() {
        let id = doujinshis[index].id;
        chrome.storage.sync.get(['tag' + id], function(elems) {
            if (elems['tag' + id] === undefined) { // If tag is not saved yet in storage
                StoreTagPage(id);
            }
            if (index !== doujinshis.length - 1) {
                StoreTags(doujinshis, index + 1);
            }
        });
    }, 500);
}

function StoreTagPage(doujinshiId) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let tags = [];
                JSON.parse(this.responseText).tags.forEach(function(elem) {
                    tags.push(new Tag(elem.id, elem.name, elem.type));
                });
                let storage = {};
                storage['tag' + doujinshiId] = "[" + tags.map(function(d) {
                    return JSON.stringify(d);
                }).toString() + "]";
                chrome.storage.sync.set(storage);
            } else {
                console.error("Error while loading doujinshi page " + doujinshiId + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/api/gallery/" + doujinshiId, true);
    http.send();
}

function StoreDoujinshis(doujinshis) {
    let i = 0;
    let storage = {};
    while (doujinshis.length > chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2) {
        storage["doujinshi" + i] = doujinshis.substr(0, chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2);
        doujinshis = doujinshis.substring(chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2, doujinshis.length);
        i++;
    }
    storage["doujinshi" + i] = doujinshis;
    chrome.storage.sync.set(storage);
}

class Doujinshi {
    constructor(id, image, name) {
        this.id = id;
        this.image = image;
        this.name = name;
    }
}

class Tag {
    constructor(id, name, category) {
        this.id = id;
        this.name = name;
        this.category = category;
    }
}