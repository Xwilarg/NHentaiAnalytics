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
                    StoreDoujinshis(doujinshis.map(function(d) {
                        return JSON.stringify(d);
                    }).toString());
                    chrome.storage.sync.set({
                        doujinshiCount: doujinshis.length
                    })
                    callback(doujinshis.length);
                }
            } else {
                console.error("Error while loading favorites page " + pageNumber + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/?page=" + pageNumber, true);
    http.send();
}

function StoreDoujinshis(doujinshis) {
    let i = 0;
    let storage = {}; //(new TextEncoder().encode(doujinshis)).length
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