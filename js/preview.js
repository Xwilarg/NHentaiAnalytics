function DisplayDounjishis() {
    chrome.extension.getBackgroundPage().DisplayDounjishis(function(doujinshis) {
        if (doujinshis.length == 0) {
            document.getElementById("preview").innerHTML = "Please log in NHentai and reload the page.";
            return;
        }
        let html = "";
        doujinshis.forEach(function(elem) {
            html += '<a href="https://nhentai.net/g/' + elem.id + '/" target="_blank">' + elem.name + '</a><br/>'
            html += '<img src="' + elem.image + '"/>';
            html += '<br/><br/>';
        });
        document.getElementById("preview").innerHTML = html;
    });
}

DisplayDounjishis();