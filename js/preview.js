function GetNextDoujinshi(id, str) {
    chrome.storage.sync.get(['doujinshi' + id], function(elems) {
        if (elems['doujinshi' + id] !== undefined) {
            GetNextDoujinshi(id + 1, str + elems['doujinshi' + id]);
        } else {
            console.log(JSON.parse("[" + str + "]"));
        }
    });
}

GetNextDoujinshi(0, "");