chrome.storage.sync.get({
    doujinshiCount: 0
}, function(elems) {
    if (elems.doujinshiCount == -1) { // Update in progress...
    } else if (elems.doujinshiCount == 0) {
        LoadFavorites();
    } else {
        document.getElementById("doujinshiCount").innerHTML = elems.doujinshiCount + " doujinshis loaded.";
    }
});

document.getElementById("preview").addEventListener("click", function() {
    chrome.tabs.create({ url: "preview.html" });
});

document.getElementById("settings").addEventListener("click", function() {
    chrome.tabs.create({ url: "settings.html" });
});

document.getElementById("help").addEventListener("click", function() {
    chrome.tabs.create({ url: "help.html" });
});

document.getElementById("suggest").addEventListener("click", function() {
    SuggestDoujinshi(0, "");
});

function SuggestDoujinshi(index, str) {
    chrome.storage.sync.get(['tags' + index], function(elems) {
        if (elems['tags' + index] === undefined) {
            if (str === "") {
                document.getElementById("suggestion").innerHTML = "Tags not loaded, please wait.<br/>If error persist, please check the 'Help' section.";
            } else {
                let obj = JSON.parse(str);
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
                    let tagName = splitKey[1];
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
                console.log("https://nhentai.net/search/?q=" + items.slice(0, 3).map(function(e) {
                    return e[0];
                }).join('+'));
            }
        } else {
            SuggestDoujinshi(index + 1, str + elems['tags' + index]);
        }
    });
}

function LoadFavorites() {
    chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
        if (nb === undefined) {
            document.getElementById("doujinshiCount").innerHTML = "You must be logged in NHentai.";
        } else {
            document.getElementById("doujinshiCount").innerHTML = nb + " doujinshis loaded.";
        }
    });
}

document.getElementById("tagCount").innerHTML = chrome.extension.getBackgroundPage().GetTagsCount() + " tags loaded.";

chrome.storage.sync.get(['tags0'], function(elems) {
    document.getElementById("savedTagCount").innerHTML = "Tags state: " + (elems.tags0 !== undefined ? "Loaded" : "Not Loaded");
});