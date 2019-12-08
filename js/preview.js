

chrome.storage.sync.get({
    doujinshiCount: 0
}, function(elems) {
    if (elems.doujinshiCount == 0) {
        chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
            document.getElementById("content").innerHTML = nb + " doujinshis loaded.";
        });
    } else {
        document.getElementById("content").innerHTML = elems.doujinshiCount + " doujinshis loaded.";
    }
});