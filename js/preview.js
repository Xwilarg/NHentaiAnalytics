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

document.getElementById("update").addEventListener("click", function() {
    document.getElementById("content").innerHTML = "Loading...";
    chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
        document.getElementById("content").innerHTML = nb + " doujinshis loaded.";
    });
});

document.getElementById("preview").addEventListener("click", function() {
    chrome.tabs.create({ url: "preview.html" });
});