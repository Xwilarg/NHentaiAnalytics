function LoadFavorites() {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let match = /<h1>My Favorites <span class="count">\(([\d]+)\)<\/span>/.exec(this.responseText);
                document.getElementById("content").innerHTML = match[1] + " doujinshis loaded.";
            } else {
                document.getElementById('content').innerHTML = "An unexpected error occured (Code " + this.status + ").";
            }
        }
    };
    http.open("GET", "https://nhentai.net/favorites/", true);
    http.send();
}

chrome.storage.sync.get({
    favorites: []
}, function(elems) {
    if (elems.favorites.length == 0) {
        LoadFavorites();
    } else {
        document.getElementById("content").innerHTML = elems.favorites.length + " doujinshis loaded.";
    }
});