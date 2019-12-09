function GetNextDoujinshi(id, str) {
    chrome.storage.sync.get(['doujinshi' + id], function(elems) {
        if (elems['doujinshi' + id] !== undefined) {
            GetNextDoujinshi(id + 1, str + elems['doujinshi' + id]);
        } else {
            let html = "";
            JSON.parse(str).forEach(function(elem) {
                html += '<a href="https://nhentai.net/g/' + elem.id + '/" target="_blank">' + elem.name + '</a><br/>'
                html += '<img src="' + elem.image + '"/>';
                html += '<br/><br/>';
            });
            document.getElementById("preview").innerHTML = html;
        }
    });
}

GetNextDoujinshi(0, "");