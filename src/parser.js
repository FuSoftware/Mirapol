const Parser = (() => {
    const del_o = '<%'; //Opening delimiter
    const del_c = '%>'; //Closing delimiter

    const patterns = {
        links : /\[\[(.+)\|(.+)\]\]|\[\[(.+)\]\]/gm
    }

    function parseText(text){

    }

    function hasLinks(text){
        return patterns.links.test(text);
    }

    function parseLinks(text){
        var m = patterns.links.exec(text);
        var l = null;

        while (m != null) {
            if(m[3] !== undefined){
                //Single
                l = buildLink(m[3], m[3])
            }else{
                //Double
                l = buildLink(m[1], m[2])
            }
            text = text.replace(m[0], l.html());
            m = patterns.links.exec(text);
        }
    }

    function buildLink(to, label){
        return jQuery('<a></a>', {
            "data-passage": to,
            class: "link-internal",
            text: label
        });
    }

    return Object.freeze(Object.defineProperties({}, {
		parseLinks : { value : parseLinks },
		hasLinks  : { value : hasLinks },
	}));

})();

export default Parser;