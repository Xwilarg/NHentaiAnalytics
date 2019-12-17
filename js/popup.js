chrome.storage.sync.get({
    doujinshiCount: 0
}, function(elems) {
    if (elems.doujinshiCount == -1) { // Update in progress...
    } else if (elems.doujinshiCount == 0) {
        LoadFavorites();
    } else {
        document.getElementById("doujinshiCount").innerHTML = elems.doujinshiCount + " doujinshis detected.";
        chrome.extension.getBackgroundPage().CheckForUpdates();
    }
});

chrome.extension.getBackgroundPage().SetLoadingCallback(function(tagCount) {
    if (tagCount === -1) {
        DisplayTagsLoaded();
    } else {
        document.getElementById("tagCount").innerHTML = "Loading tags... " + tagCount
    }
}, function(doujinshiCount) {
    document.getElementById("doujinshiCount").innerHTML = doujinshiCount + " doujinshis detected.";
});

document.getElementById("settings").addEventListener("click", function() {
    chrome.tabs.create({ url: "settings.html" });
});

document.getElementById("help").addEventListener("click", function() {
    chrome.tabs.create({ url: "help.html" });
});

document.getElementById("suggest").addEventListener("click", function() {
    SuggestDoujinshi();
});

function SuggestDoujinshi() {
    document.getElementById("suggestion").innerHTML = "Loading...";
    chrome.storage.sync.get({
        tags0: "",
        tagsPerSearch: 3,
        favoriteTags: 5
    }, function(elems) {
        if (elems.tags0 === undefined || elems.tags0 === "") {
            document.getElementById("suggestion").innerHTML = "Tags are being loaded, please retry later...";
        } else {
            chrome.extension.getBackgroundPage().GetTags(function(obj) {
                let json = Object.keys(obj).reduce((res, key) => {
                    res[key] = {
                        value: obj[key]
                    };
                    return res;
                }, {});
                let artists = {};
                let characters = {};
                let groups = {};
                let parodies = {};
                let tags = {};
                let categories = {};
                let languages = {};
                for (const [key, value] of Object.entries(json)) {
                    let splitKey = key.split('/');
                    let categoryName = splitKey[0];
                    let tagName = splitKey[1].replace(new RegExp(' ', 'g'), '+');
                    if (categoryName == "artist") artists[tagName] = value.value;
                    else if (categoryName == "character") characters[tagName] = value.value;
                    else if (categoryName == "group") groups[tagName] = value.value;
                    else if (categoryName == "parody") parodies[tagName] = value.value;
                    else if (categoryName == "tag") tags[tagName] = value.value;
                    else if (categoryName == "category") categories[tagName] = value.value;
                    else if (categoryName == "language") languages[tagName] = value.value;
                    else console.error("Invalid category " + categoryName);
                }
                let items = Object.keys(tags).map(function(key) {
                    return [key, tags[key]];
                });
                items.sort(function(first, second) {
                    return second[1] - first[1];
                });
                if (Object.keys(items).length > elems.favoriteTags) {
                    items = items.slice(0, elems.favoriteTags);
                } else {
                    items = items;
                }
                let selectedTags = [];
                while (items.length > 0 && selectedTags < elems.tagsPerSearch) {
                    let index = Math.floor(Math.random() * items.length);
                    selectedTags.push(items[index][0]);
                    items.splice(index, 1);
                }
                chrome.extension.getBackgroundPage().GetRandomDoujinshi("https://nhentai.net/search/?q=" + selectedTags.join('+'), function(doujinshi, strictSearch) {
                    SuggestionToHtml(doujinshi, strictSearch);
                });
            });
        }
    });
}

function GetSuggestion() {
    let doujinshi = chrome.extension.getBackgroundPage().GetSuggestion();
    if (doujinshi !== undefined) {
        SuggestionToHtml(doujinshi);
    }
}

function SuggestionToHtml(doujinshi, strictSearch) {
    if (doujinshi === undefined) {
        document.getElementById("suggestion").innerHTML = "Doujinshi not found after 20 tries.<br/>That probably means you don't have enough favorite for the search to be work properly.";
    } else {
        let html = '<a href="https://nhentai.net/g/' + doujinshi.id + '/" target="_blank">' + doujinshi.name + '</a><br/>';
        chrome.storage.sync.get({
            previewImage: "show"
        }, function(elems) {
            if (elems.previewImage === "show") {
                html += '<img src="' + doujinshi.image + '"/><br/>';
            } else if (elems.previewImage === "blur") {
                html += '<img class="blur" src="' + doujinshi.image + '"/><br/>';
            }
            if (!strictSearch) {
                html += "(Strict search was disabled for this search, results may be less accurate)"
            }
            document.getElementById("suggestion").innerHTML = html;
        });
    }
}

function LoadFavorites() {
    chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
        if (nb === undefined) {
            document.getElementById("doujinshiCount").innerHTML = "You must be logged in NHentai.";
        } else {
            document.getElementById("doujinshiCount").innerHTML = nb + " doujinshis detected.";
        }
    });
}

chrome.storage.sync.get(['tags0'], function(elems) {
    if (elems.tags0 !== undefined && elems.tags0 !== "") {
        DisplayTagsLoaded();
    } else {
        document.getElementById("tagCount").innerHTML = "Tags not loaded.<br/>If the error persist, make sure you are connected to NHentai and reload them manually."
    }
});

function DisplayTagsLoaded() {
    document.getElementById("tagCount").innerHTML = "Tags loaded.";
    chrome.extension.getBackgroundPage().GetTags(function(tags) {
        let items = Object.keys(tags).map(function(key) {
            return [key, tags[key]];
        });
        items = items.filter(function(e) { return e[0].split('/')[0] == "tag" ; });
        if (items.length < 100) {
            document.getElementById("tagCount").innerHTML += '<p class="red">You have less than 100 tags, search may be less accurate.<br/>Try adding more doujinshi to your favorite.</p>';
        }
    });
}

GetSuggestion();

class Doujinshi {
    constructor(id, image, name) {
        this.id = id;
        this.image = image;
        this.name = name;
    }
}