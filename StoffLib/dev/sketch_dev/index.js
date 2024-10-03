import register_recording_methods from "./recording.js";

export default (Sketch) => {
    const Sketch_dev = {
        _serve_html: (...args) => {
            throw new Error("Not connected to a webserver!");
        }
    }
    
    const old_init = Sketch.prototype._init ? Sketch.prototype._init : () => {};
    Sketch.prototype._init = function (){
        old_init.bind(this)();
        this.dev = {};
        Object.keys(Sketch_dev).forEach(key => {
            this.dev[key] = Sketch_dev[key].bind(this);
        });
    };
    
    Sketch.dev = Sketch_dev;
    register_recording_methods(Sketch);
}