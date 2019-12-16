document.getElementById("update").addEventListener("click", function() {
    document.getElementById("nbDoujinshi").innerHTML = "Loading...";
    CleanTagsInternal(0, function() {
        chrome.storage.sync.set({
            doujinshiCount: -1
        });
        chrome.extension.getBackgroundPage().LoadFavorites(function(nb) {
            document.getElementById("nbDoujinshi").innerHTML = nb + " doujinshis loaded.";
        });
    })
});

document.getElementById("default").addEventListener("click", function() {
    document.getElementById("tagsPerSearch").value = 3;
    document.getElementById("favoriteTags").value = 5;
    chrome.storage.sync.set({
        tagsPerSearch: 3,
        favoriteTags: 5
    });
});

chrome.storage.sync.get({
    doujinshiCount: 0,
    previewImage: "show",
    tagsPerSearch: 3,
    favoriteTags: 5,
    requestsDelay: 500
}, function(elems) {
    if (elems.doujinshiCount == -1) { // Update in progress...
        document.getElementById("nbDoujinshi").innerHTML = "0 doujinshis loaded.";
    } else {
        document.getElementById("nbDoujinshi").innerHTML = elems.doujinshiCount + " doujinshis loaded.";
    }
    var select = document.getElementById('previewImage');
    for (var i, j = 0; i = select.options[j]; j++) {
        if (i.value == elems.previewImage) {
            select.selectedIndex = j;
            break;
        }
    }
    document.getElementById("tagsPerSearch").value = elems.tagsPerSearch;
    document.getElementById("favoriteTags").value = elems.favoriteTags;
    document.getElementById("requestsDelay").value = elems.requestsDelay;
});

tagsPerSearch.addEventListener('change', function() {
    let value = parseInt(document.getElementById("tagsPerSearch").value);
    chrome.storage.sync.get({
        tagsPerSearch: 3,
        favoriteTags: 5
    }, function(elems) {
        if (!isNaN(value) && value > 0 && value <= elems.favoriteTags) {
            chrome.storage.sync.set({
                tagsPerSearch: value
            });
        } else {
            document.getElementById("tagsPerSearch").value = elems.tagsPerSearch;
        }
    });
});

favoriteTags.addEventListener('change', function() {
    let value = parseInt(document.getElementById("favoriteTags").value);
    chrome.storage.sync.get({
        tagsPerSearch: 3,
        favoriteTags: 5
    }, function(elems) {
        if (!isNaN(value) && value > 0 && value >= elems.tagsPerSearch) {
            chrome.storage.sync.set({
                favoriteTags: value
            });
        } else {
            document.getElementById("favoriteTags").value = elems.favoriteTags;
        }
    });
});

requestsDelay.addEventListener('change', function() {
    let value = parseInt(document.getElementById("requestsDelay").value);
    if (!isNaN(value) && value >= 0) {
        chrome.storage.sync.set({
            requestsDelay: value
        });
    } else {
        chrome.storage.sync.get({
            requestsDelay: 500
        }, function(elems) {
            document.getElementById("requestsDelay").value = elems.requestsDelay;
        });
    }
});

previewImage.addEventListener('change', function() {
    chrome.storage.sync.set({
        previewImage: this.options[this.selectedIndex].value
    });
});

function CleanTagsInternal(index, callback) {
    chrome.storage.sync.get(['tags' + index], function(elems) {
        if (elems['tags' + index] === undefined) {
            callback();
        } else {
            let storage = {};
            storage["tags" + index] = "";
            chrome.storage.sync.set(storage);
            CleanTagsInternal(index + 1, callback);
        }
    });
}