import { Sketch } from "../StoffLib/sketch.js";
import { spline } from "../StoffLib/curves.js";

export default function(){
    const s = new Sketch();
    const p1 = s.add(0,0);
    const p2 = s.add(1,1);

    const EX = new ExpositionInstance("EXPOSITION");

    const EX_sketch = new ExpositionInstance("Sketch", getInstanceMethodNames(s));
    EX.object(EX_sketch);
    EX_sketch.object(
        new ExpositionInstance("dev", Object.keys(s.dev))
    );

    EX.object(new ExpositionInstance("Point", getInstanceMethodNames(p1)));
    EX.object(new ExpositionInstance("Line", getInstanceMethodNames(s.line_between_points(p1, p2))));
    EX.object(new ExpositionInstance("ConnectedComponent", getInstanceMethodNames(s.connected_component(p1))));
    
    const curves = EX.object(new ExpositionInstance("[Curves]"));
    curves.method("arc");
    curves.object(new ExpositionInstance("spline", Object.keys(spline)));

    EX.object(new ExpositionInstance("Config", [
        "config",
        "cBoolean",
        "cContainer",
        "cNumber",
        "cOption",
        "cSelection",
        "cStatic"
    ]));

    return EX;
}

function hasMethod(obj, name) {
    const desc = Object.getOwnPropertyDescriptor (obj, name);
    return !!desc && typeof desc.value === 'function';
}

function getInstanceMethodNames(obj, stop) {
    let array = [];
    let proto = Object.getPrototypeOf (obj);
    while (proto && proto !== stop) {
    Object.getOwnPropertyNames (proto)
        .forEach (name => {
            if (name !== 'constructor') {
                if (hasMethod (proto, name)) {
                array.push (name);
                }
            }
        });
        proto = Object.getPrototypeOf (proto);
    }

    return array.filter(element => ![
        "toString",
        "valueOf",
        "toLocaleString",
        "propertyIsEnumerable",
        "isPrototypeOf",
        "hasOwnProperty"
    ].includes(element) && !element.startsWith("_")).sort();

}

class ExpositionInstance{
    constructor(name, methods = [], objects = []){
        this.name = name;
        this._methods = methods;
        this._objects = objects;
    }

    method(...m){
        this.methods(...m);
        return m[0];
    }

    methods(...m){
        this._methods.push(...m);
        return this;
    }

    object(...o){
        this.objects(...o);
        return o[0];
    }

    objects(...o){
        this._objects.push(...o);
        return this;
    }

    render(level = 1){
        return `
            <div class="ex_level${ level } ex">
                <h${level + 1}>${ this.name.replace(/</g, "&lt;").replace(/>/, "&gt;") }</h${level + 1}>
                <pre>${ this._methods.map(m => "<span>" + m + "</span>").join("\n") }</pre>
                <div class="sub_objects">
                    ${ this._objects.map(o => o.render(level + 1)).join("\n") }
                </div>
            </div>
        `;
    }
}
