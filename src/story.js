import Passage  from './passage.js';

const Story = (() => {
    const _passages = {};
    const _styles = [];
    const _scripts = [];
    const _name = '';
    const _ifid = '';

    function load(el){
        el.children('tw-passagedata').each(function() {
            var $t = jQuery(this);
            var pid = parseInt($t.attr('pid'));
            var tags = $t.attr('tags');

            _passages[pid] = new Passage(
                pid,
                $t.attr('name'),
                $t.attr('tags'),
                $t.html()
            );
        });
    }

    function getPassage(id){
        switch(typeof title){
            case 'number':
        }
    }

    function hasPassage(id){
        switch(typeof title){
            case 'number':
                return typeof this._passages[id] !== undefined;
            case 'string':
                return hasPassageTitle(id);
            default:
                console.warn('Trying to check passage with type ' + typeof title);
                break;
        }
    }

    function hasPassageTitle(title){
        this._passages.forEach(element => {
            if(e.name === title){
                return true;
            }
        });
        return false;
    }

    return Object.freeze(Object.defineProperties({}, {
		passages : { value : _passages },
		load  : { value : load },
		title : { value : _name },
        has : { value : hasPassage },
		get : { value : getPassage },
	}));
})();

export default Story;