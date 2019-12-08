function GetNextDoujinshi(id, str) {
    chrome.storage.sync.get(['doujinshi' + id], function(elems) {
        if (elems['doujinshi' + id] !== undefined) {
            GetNextDoujinshi(id + 1, str + elems['doujinshi' + id]);
        } else {
            JSON.parse("[" + str + "]").forEach(function(elem) {
                console.log(elem);
            });
        }
    });
}

GetNextDoujinshi(0, "");