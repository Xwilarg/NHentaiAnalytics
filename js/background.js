let g_doujinshis = []; // User's favorite doujinshis
let g_tagsPerDoujinshi = {}; // Tags for each doujinshi
let g_tagsCount = {}; // In all favorite doujinshi, number of occurance for each tags
let g_tagsName = {}; // Get tag class given it id

function LoadFavorites(callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                if (this.responseText.includes("Abandon all hope, ye who enter here")) {
                    callback(undefined); // Not logged in
                } else {
                    g_doujinshis = [];
                    g_tagsPerDoujinshi = {};
                    g_tagsCount = {};
                    LoadFavoritePage(1, callback);
                }
            } else {
                console.error("Error while loading doujinshi count (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/", true);
    http.send();
}

function LoadFavoritePage(pageNumber, callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let currDoujinshis = [];
                let matchs = /<a href="\/g\/([0-9]+)\/".+img src="([^"]+)".+<div class="caption">([^<]+)<\/div>/g; // Get all doujinshis
                do {
                    match = matchs.exec(this.responseText);
                    if (match !== null) {
                        let image = match[2];
                        if (image.startsWith("//")) {
                            image = "https:" + image;
                        }
                        currDoujinshis.push(new Doujinshi(match[1], image, match[3]));
                    }
                } while (match);
                g_doujinshis = g_doujinshis.concat(currDoujinshis);
                if (currDoujinshis.length > 0) {
                    LoadFavoritePage(pageNumber + 1, callback);
                } else {
                    chrome.storage.sync.set({
                        doujinshiCount: g_doujinshis.length
                    });
                    callback(g_doujinshis.length); // Display doujinshi count on popup
                    StoreTags(0);
                }
            } else {
                console.error("Error while loading favorites page " + pageNumber + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/?page=" + pageNumber, true);
    http.send();
}

function StoreTags(index) { // We wait 500 ms before checking each page so the API doesn't return a 50X error
    setTimeout(function() {
        let id = g_doujinshis[index].id;
        let http = new XMLHttpRequest();
        http.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    g_tagsPerDoujinshi[id] = [];
                    JSON.parse(this.responseText).tags.forEach(function(elem) {
                        let tag = new Tag(elem.id, elem.name, elem.type);
                        g_tagsPerDoujinshi[id].push(tag);
                        if (g_tagsName[elem.id] === undefined) {
                            g_tagsName[elem.id] = tag;
                        }
                        if (g_tagsCount[elem.id] === undefined) {
                            g_tagsCount[elem.id] = 1;
                        } else {
                            g_tagsCount[elem.id]++;
                        }
                    });
                    if (index + 1 !== g_doujinshis.length) {
                        StoreTags(index + 1);
                    }
                } else {
                    console.error("Error while loading doujinshi page " + doujinshiId + " (Code " + this.status + ").");
                }
            }
        };
        http.open("GET", "https://nhentai.net/api/gallery/" + id, true);
        http.send();
    }, 500);
}

function StoreTagsName() {
    let i = 0;
    let storage = {};
    let str = JSON.stringify(g_tagsName);
    while (str.length > chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2) {
        storage["tags" + i] = str.substr(0, chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2);
        str = str.substring(chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2, str.length);
        i++;
    }
    storage["tags" + i] = str;
    chrome.storage.sync.set(storage);
}

function DisplayDounjishis(callback) {
    callback(g_doujinshis, g_tagsPerDoujinshi);
}

function GetTagsCount() {
    return Object.keys(g_tagsName).length;
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