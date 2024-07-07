export default (Sketch) => {
    const Sketch_dev = {}
    
    const old_init = Sketch.prototype._init ? Sketch.prototype._init : () => {};
    Sketch.prototype._init = function (){
        old_init.bind(this)();
        this.dev = {};
        Object.keys(Sketch_dev).forEach(key => {
            this.dev[key] = Sketch_dev[key].bind(this);
        });
    };
    
    return Sketch_dev;
}