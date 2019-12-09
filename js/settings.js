document.getElementById("update").addEventListener("click", function() {
    document.getElementById("nbDoujinshi").innerHTML = "Loading...";
    chrome.storage.sync.clear();
    chrome.storage.sync.set({
        doujinshiCount: -1
    });
    chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
        document.getElementById("nbDoujinshi").innerHTML = nb + " doujinshis loaded.";
    });
});

chrome.storage.sync.get({
    doujinshiCount: 0
}, function(elems) {
    if (elems.doujinshiCount == -1) { // Update in progress...
        document.getElementById("nbDoujinshi").innerHTML = "0 doujinshis loaded.";
    } else {
        document.getElementById("nbDoujinshi").innerHTML = elems.doujinshiCount + " doujinshis loaded.";
    }
});