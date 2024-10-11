import register_recording_methods from "./recording.js";
import register_render_at from "./render_at.js";
import Route from "./request_routing.js";

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
    
    Sketch.dev = Sketch_dev;
    Route.Sketch = Sketch;
    register_render_at(Sketch);
    register_recording_methods(Sketch);
}