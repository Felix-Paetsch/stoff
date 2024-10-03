import ConfigElement from "./_config_element.js";

export default class ChildrenHaving extends ConfigElement {
    constructor(name, children){
        super(name);
        this.children = ConfigElement.as_unfolded_components(children);
        this.children.forEach(c => c.parent = this);
    }

    init(config){
        this.children.forEach(c => c.init(config));
    }

    serialize_children(){
        return this.children.map((c) => c.serialize());
    }

    static deserialize_children(serialized_children){
        return serialized_children.map(c => ConfigElement.deserialize_component(c))
    }

    to_obj(as_arr = false){
        if (as_arr){
            const res = [];
            this.children.forEach(c => {
                const o = c.to_obj();
                if (typeof o !== "undefined"){
                    res.push(o);
                }
            });
        }

        const res = {};
        this.children.forEach(c => {
            const o = c.to_obj();
            if (c.name === null){
                Object.assign(res, o);
            } else {
                res[c.name] = o;
            }
        });
        
        return res;
    }

    get_by_id(id){
        if (this.id == id){
            return this;
        }

        for (const c of this.children){
            const r = c.get_by_id(id);
            if (r) return r;
        }

        return undefined;
    }

    get_by_name(name){
        const r = []
        if (this.name == name){
            return r.push(name);
        }

        for (const c of this.children){
            r.push(c.get_by_name(name));
        }

        return r;
    }
}