import register_recording_methods from "./recording.js";
import Route from "./request_routing.js";

export default (Sketch) => {
    Error.stackTraceLimit = Infinity;

    let count = 0;
    const Sketch_dev = {
        at_new_url: function (url) {
            return this.dev.at_url(url + count++);
        },
    };

    {
        const old_init = Sketch.prototype._init
            ? Sketch.prototype._init
            : () => {};
        Sketch.prototype._init = function () {
            old_init.bind(this)();
            this.dev = {};
            Object.keys(Sketch_dev).forEach((key) => {
                this.dev[key] = Sketch_dev[key].bind(this);
            });
        };
    }

    Sketch.dev = Sketch_dev;
    register_recording_methods(Sketch);

    const Line_dev = {
        mark_endpoints: function () {
            this.p1.set_color("green");
            this.p2.set_color("red");
            try {
                this.p1.data._side = "p1";
                this.p2.data._side = "p2";
            } catch {}
            this.p1.attributes.radius = 5;
            this.p2.attributes.radius = 5;
            this.attributes.strokeWidth = 2;
        },
    };

    {
        const old_init = Sketch.Line.prototype._init
            ? Sketch.Line.prototype._init
            : () => {};
        Sketch.Line.prototype._init = function () {
            old_init.bind(this)();
            this.dev = {};
            Object.keys(Line_dev).forEach((key) => {
                this.dev[key] = Line_dev[key].bind(this);
            });
        };
    }

    Sketch.Line.dev = Line_dev;

    Route.Sketch = Sketch;
};
