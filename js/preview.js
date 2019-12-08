

chrome.storage.sync.get({
    favorites: []
}, function(elems) {
   // if (elems.favorites.length == 0) {
        chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
            document.getElementById("content").innerHTML = nb + " doujinshis loaded.";
        });
    /*} else {
        document.getElementById("content").innerHTML = elems.favorites.length + " doujinshis loaded.";
    }*/
});