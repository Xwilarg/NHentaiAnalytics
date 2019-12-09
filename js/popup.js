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
    document.getElementById("suggestion").innerHTML = "Tags not loaded, please wait.<br/>If error persist, please check the 'Help' section.";
});

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