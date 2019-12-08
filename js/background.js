function LoadFavorites(callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let match = /<h1>My Favorites <span class="count">\(([\d]+)\)<\/span>/.exec(this.responseText); // REGEX to find favorite count
                callback(match[1]);
                LoadFavoritePage(1, []);
            } else {
                console.error("Error while loading doujinshi count (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/", true);
    http.send();
}

function LoadFavoritePage(pageNumber, doujinshis) {
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
                    LoadFavoritePage(pageNumber + 1, doujinshis.concat(currDoujinshis));
                } else {
                    console.log(chrome.storage.sync.QUOTA_BYTES_PER_ITEM);
                    console.log(doujinshis.map(function(d) {
                        return JSON.stringify(d);
                    }).toString());
                    chrome.storage.sync.set({
                        favorites: doujinshis.map(function(d) {
                            return JSON.stringify(d);
                        }).toString()
                    });
                }
            } else {
                console.error("Error while loading favorites page " + pageNumber + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/?page=" + pageNumber, true);
    http.send();
}

class Doujinshi {
    constructor(id, image, url) {
        this.id = id;
        this.image = image;
        this.url = url;
    }
}