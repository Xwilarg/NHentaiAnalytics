let g_doujinshis = []; // User's favorite doujinshis
let g_tagsCount = {}; // In all favorite doujinshi, number of occurance for each tags
let g_blacklistTags = [];
let g_doujinshiDebug = {};
let g_suggestedDoujinshi = undefined;
var loadingCallback = undefined;
var doujinshiCallback = undefined;
var settingsDoujinshiCallback = undefined;
var settingsDebugCallback = undefined;

function SetLoadingCallback(callbackTags, callbackDoujinshi) {
    loadingCallback = callbackTags;
    doujinshiCallback = callbackDoujinshi;
}

function SetSettingsCallback(callbackDoujinshi, callbackDebug) {
    settingsDoujinshiCallback = callbackDoujinshi;
    settingsDebugCallback = callbackDebug;
}

function CheckForUpdates() {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                if (this.responseText.includes('<span class="count">')) {
                    let match = /<span class="count">\(([0-9]+)\)<\/span>/.exec(this.responseText);
                    let doujinshiCount = parseInt(match[1]);
                    chrome.storage.sync.get({
                        doujinshiCount: 0
                    }, function(elems) {
                        if (doujinshiCount !== elems.doujinshiCount) {
                            g_doujinshis = [];
                            g_tagsCount = {};
                            g_doujinshiDebug = {};
                            LoadBlacklistedTags(this.responseText);
                            LoadFavoritePage(1);
                        }
                    });
                }
            } else {
                console.error("Error while loading doujinshi count (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/", true);
    http.send();
}

/// Load favorites into storage
function LoadFavorites() {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                if (this.responseText.includes("Abandon all hope, ye who enter here")) {
                    callback(undefined); // Not logged in
                } else {
                    g_doujinshis = [];
                    g_tagsCount = {};
                    g_doujinshiDebug = {};
                    chrome.storage.sync.set({
                        doujinshiCount: -1
                    });
                    LoadBlacklistedTags(this.responseText);
                    LoadFavoritePage(1);
                }
            } else {
                console.error("Error while loading doujinshi count (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/", true);
    http.send();
}

function LoadBlacklistedTags(html) {
    g_blacklistTags = JSON.parse(/blacklisted_tags: (\[[^\]]*\])/.exec(html)[1]);
}

/// Load one page of favorite into storage
function LoadFavoritePage(pageNumber, callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let currDoujinshis = GetDoujinshisFromHtml(this.responseText);
                g_doujinshis = g_doujinshis.concat(currDoujinshis);
                if (currDoujinshis.length > 0) {
                    LoadFavoritePage(pageNumber + 1);
                } else {
                    chrome.storage.sync.set({
                        doujinshiCount: g_doujinshis.length
                    });
                    if (doujinshiCallback !== undefined) { // Display doujinshi count on popup
                        doujinshiCallback(g_doujinshis.length);
                    }
                    if (settingsDoujinshiCallback !== undefined) { // Display doujinshi count on popup
                        settingsDoujinshiCallback(g_doujinshis.length);
                    }
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

/// Get all doujinshis that are in a page, return an array of Doujinshi
function GetDoujinshisFromHtml(html) {
    let currDoujinshis = [];
    let matchs = /<a href="\/g\/([0-9]+)\/".+img src="([^"]+)".+<div class="caption">([^<]+)<\/div>/g; // Get all doujinshis
    do {
        match = matchs.exec(html);
        if (match !== null) {
            let image = match[2];
            if (image.startsWith("//")) {
                image = "https:" + image;
            }
            currDoujinshis.push(new Doujinshi(match[1], image, match[3]));
        }
    } while (match);
    return currDoujinshis;
}

function GetRandomDoujinshi(url, callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let match = /<a href="\?q=[^&]+&amp;page=([0-9]+)" class="last">/.exec(this.responseText);
                let maxPage = parseInt(match[1]);
                GetRandomDoujinshiFromPage(url + "&page=" + (Math.floor(Math.random() * maxPage) + 1), callback);
            } else {
                console.error("Error while loading page " + url + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", url, true);
    http.send();
}

/// Get a random doujinshi from a page
function GetRandomDoujinshiFromPage(url, callback) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let doujinshis = GetDoujinshisFromHtml(this.responseText);
                GetRandomDoujinshiFromList(doujinshis, 0, callback, true);
            } else {
                console.error("Error while loading page " + url + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", url, true);
    http.send();
}

function GetRandomDoujinshiFromList(doujinshis, nbTries, callback, strictSearch) {
    currDoujinshi = doujinshis[Math.floor(Math.random() * doujinshis.length)];
    CheckDoujinshiValid(currDoujinshi, function() {
        g_suggestedDoujinshi = currDoujinshi;
        callback(g_suggestedDoujinshi, strictSearch);
    }, function() {
        chrome.storage.sync.get({
            requestsDelay: 500,
            strictSearch: true,
            nbTriesBeforeDefault: 10,
            defaultSearch: false,
            nbTriesBeforeFail: 10
        }, function(elems) {
            let maxNbOfTries = 0;
            if (elems.strictSearch) {
                maxNbOfTries = elems.nbTriesBeforeDefault;
            }
            if (!elems.defaultSearch) {
                maxNbOfTries += elems.nbTriesBeforeFail;
            }
            if (nbTries >= maxNbOfTries) {
                callback(undefined);
            } else {
                setTimeout(function() {
                    if (elems.strictSearch && nbTries < elems.nbTriesBeforeDefault) {
                        GetRandomDoujinshiFromList(doujinshis, nbTries + 1, callback, true);
                    } else {
                        GetRandomDoujinshiFromList(doujinshis, nbTries + 1, callback, false);
                    }
                }, elems.requestsDelay);
            }
        });
    }, strictSearch);
}

/// Check if a doujinshi contains the right tags
function CheckDoujinshiValid(doujinshi, callbackSuccess, callbackFailure, strictSearch) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                LoadTagsInternal(0, "", function(tags) {
                    let isError = false;
                    let httpTags = JSON.parse(http.responseText).tags;
                    for (let i = 0; i < httpTags.length; i++) {
                        let elem = httpTags[i];
                        if ((strictSearch && elem.type == "tag" && !Object.keys(tags).includes('tag/' + elem.name)) || 
                            (!strictSearch && g_blacklistTags.includes(elem.id)))
                        {
                            callbackFailure();
                            isError = true;
                            return;
                        }
                    }
                    if (!isError) {
                        callbackSuccess();
                    }
                });
            } else {
                console.error("Error while loading doujinshi " + doujinshi.id + " (Code " + this.status + ").");
            }
        }
    };
    http.open("GET", "https://nhentai.net/api/gallery/" +  + doujinshi.id, true);
    http.send();
}

/// Check all doujinshi and get their tags to store them
function StoreTags(index) { // We wait 500 ms before checking each page so the API doesn't return a 50X error
    chrome.storage.sync.get({
        requestsDelay: 500
    }, function(elems) {
        setTimeout(function() {
            let id = g_doujinshis[index].id;
            let http = new XMLHttpRequest();
            http.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        let httpTags = JSON.parse(this.responseText).tags;
                        for (let i = 0; i < httpTags.length; i++) {
                            let elem = httpTags[i];
                            if (g_blacklistTags.includes(elem.id)) { // Ignore tags that were blacklisted
                                return;
                            }
                            let tag = new Tag(elem.id, elem.name, elem.type);
                            let tagId = elem.type + "/" + elem.name;
                            if (g_tagsCount[tagId] === undefined) {
                                g_tagsCount[tagId] = 1;
                                g_doujinshiDebug[tag.id] = [tag, g_doujinshis[index]];
                            } else {
                                g_tagsCount[tagId]++;
                                if (!g_doujinshiDebug[tag.id].includes(g_doujinshis[index])) {
                                    g_doujinshiDebug[tag.id].push(g_doujinshis[index]);
                                }
                            }
                        }
                        if (settingsDebugCallback !== undefined) {
                            settingsDebugCallback(g_doujinshiDebug);
                        }
                        if (loadingCallback !== undefined) {
                            loadingCallback(GetTagsCount());
                        }
                        if (index + 1 !== g_doujinshis.length) {
                            StoreTags(index + 1);
                        } else {
                            StoreTagsName();
                            if (loadingCallback !== undefined) {
                                loadingCallback(-1);
                            }
                        }
                    } else {
                        console.error("Error while loading doujinshi page " + doujinshiId + " (Code " + this.status + ").");
                    }
                }
            };
            http.open("GET", "https://nhentai.net/api/gallery/" + id, true);
            http.send();
        }, elems.requestsDelay);
    });
}

function LoadTagsInternal(index, str, callback) {
    chrome.storage.sync.get(['tags' + index], function(elems) {
        if (elems['tags' + index] === undefined) {
            callback(JSON.parse(str));
        } else {
            LoadTagsInternal(index + 1, str + elems['tags' + index], callback);
        }
    });
}

/// Store tags into storage, making sure it doesn't mess with QUOTA_BYTES_PER_ITEM
function StoreTagsName() {
    CleanTagsInternal(0, function() {
        let i = 0;
        let storage = {};
        let str = JSON.stringify(g_tagsCount);
        while (str.length > chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2) {
            storage["tags" + i] = str.substr(0, chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2);
            str = str.substring(chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2, str.length);
            i++;
        }
        storage["tags" + i] = str;
        chrome.storage.sync.set(storage);
    });
}

function CleanTagsInternal(index, callback) {
    chrome.storage.sync.get(['tags' + index], function(elems) {
        if (elems['tags' + index] === undefined) {
            callback();
        } else {
            let storage = {};
            storage["tags" + index] = "";
            chrome.storage.sync.set(storage);
            CleanTagsInternal(index + 1, callback);
        }
    });
}

function GetTagsCount() {
    return Object.keys(g_tagsCount).length;
}

function GetTags(callback) {
    LoadTagsInternal(0, "", function(tags) {
        callback(tags);
    });
}

function GetSuggestion() {
    return g_suggestedDoujinshi;
}

function GetDoujinshiDebug() {
    return g_doujinshiDebug;
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