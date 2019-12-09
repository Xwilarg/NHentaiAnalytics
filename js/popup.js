chrome.storage.sync.get({
    doujinshiCount: 0
}, function(elems) {
    if (elems.doujinshiCount == -1) { // Update in progress...
    } else if (elems.doujinshiCount == 0) {
        LoadFavorites();
    } else {
        document.getElementById("content").innerHTML = elems.doujinshiCount + " doujinshis loaded.";
    }
});

document.getElementById("preview").addEventListener("click", function() {
    chrome.tabs.create({ url: "preview.html" });
});

document.getElementById("settings").addEventListener("click", function() {
    chrome.tabs.create({ url: "settings.html" });
});

function LoadFavorites() {
    chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
        if (nb === undefined) {
            document.getElementById("content").innerHTML = "You must be logged in NHentai.";
        } else {
            document.getElementById("content").innerHTML = nb + " doujinshis loaded.";
        }
    });
}