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
    SuggestDoujinshi();
});

function SuggestDoujinshi() {
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
        chrome.extension.getBackgroundPage().GetRandomDoujinshi("https://nhentai.net/search/?q=" + items.slice(0, 3).map(function(e) {
            return e[0];
        }).join('+'), function(doujinshi) {
            SuggestionToHtml(doujinshi);
        });
    });
}

function GetSuggestion() {
    let doujinshi = chrome.extension.getBackgroundPage().GetSuggestion();
    if (doujinshi !== undefined) {
        SuggestionToHtml(doujinshi);
    }
}

function SuggestionToHtml(doujinshi) {
    let html = '<a href="https://nhentai.net/g/' + doujinshi.id + '/" target="_blank">' + doujinshi.name + '</a><br/>';
    chrome.storage.sync.get({
        previewImage: "show"
    }, function(elems) {
        if (elems.previewImage === "show") {
            html += '<img src="' + doujinshi.image + '"/><br/>';
        } else if (elems.previewImage === "blur") {
            html += '<img class="blur" src="' + doujinshi.image + '"/><br/>';
        }
        document.getElementById("suggestion").innerHTML = html;
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

GetSuggestion();

class Doujinshi {
    constructor(id, image, name) {
        this.id = id;
        this.image = image;
        this.name = name;
    }
}