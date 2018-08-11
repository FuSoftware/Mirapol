const Passage = (() => {
    class Passage{
        constructor(id, name, tags, source){
            this._tags = tags;
            this._id = id;
            this._name = name;
            this._source = source;
    
            console.log('Created passage ' + this._id + '-' + this._name);
        }

        get name(){
            return this._name;
        }
    }    
    return Passage;
})();

export default Passage;