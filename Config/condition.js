import ChildrenHaving from "./_chilren_having.js";
import ConfigElement from "./_config_element.js";

// Contains an array of ConfigElements

export default class CCondition extends ChildrenHaving {
    constructor(depends_on, validation_fun, ...children){
        super(null, children);
        
        this.initialized = false;
        this._is_valid = false;
        this.validation_live = false;
        this.currently_validating = false;
        
        this.depends_on = depends_on;
        this.validation_fun = validation_fun;
    }

    init(config){
        this.initialized = true;
        for (let i = 0; i < this.depends_on.length; i++){
            if (this.depends_on[i] instanceof ConfigElement){
                continue;
            }

            const by_id = config.get_by_id(this.depends_on[i]);
            if (by_id){
                this.depends_on[i] = by_id;
                continue;
            }

            const by_name = config.get_by_name(this.depends_on[i]);
            if (by_name.length == 1){
                this.depends_on[i] = by_name[0];
                continue;
            }

            throw new Error("CCondition can't find reference to ", this.depends_on[i]);
        }

        this.depends_on.forEach(d => {
            globalThis.validation_live = false;
            d.on_change(this.validate.bind(this));
        });
    }

    serialize(){
        if (!this.initialized){
            throw new Error("CCondition not initialized!");
        }

        return {
            "name": this.name,
            "type": "CCondition",
            "depends_on": this.depends_on.map(d => d.id),
            "validation_fun": this.validation_fun.toString(),
            "children": this.children.map((c) => c.serialize()),
            id: this.id
        }
    }

    validate(){
        // You can't depend on a condition, hence no need to trigger a changed();

        this.currently_validating = true;
        this._is_valid = this.validation_fun(...this.depends_on.map(c => c.to_obj()));
        this.currently_validating = false;
        this.validation_live = true;
    }

    is_valid(){
        if (!this.validation_live) this.validate();
        return this._is_valid;
    }

    static deserialize(data){
        const val_fun = eval(data["validation_fun"]);

        return new CCondition(
            data["depends_on"],
            val_fun,
            data["children"].map(c => ConfigElement.deserialize_component(c))
        ).set_id(data.id);
    }

    to_obj(as_arr = false){
        if (this.currently_validating){
            return null;
        }

        if (!this.is_valid()){
            return undefined;
        }

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
            if (typeof o !== "undefined"){
                res[c.name] = o;
            }
        });
        
        return res;
    }

    /* frontend stuff  */

    render(dir, own_path){
        return this._dev_render("condition_component.ejs", dir, own_path);
    }

    on_dom_load(own_path){
        this.depends_on.forEach(d => d.on_change(() => {
            const serialized_path = ConfigElement.serialize_path(own_path);
            const dom_el = document.querySelector(`[x-component-path="${ serialized_path }"]`);
            if (this.is_valid()){
                dom_el.classList.remove("hidden");
            } else {
                dom_el.classList.add("hidden");
            }
        }));
    }
}

ConfigElement.classDecendents.CCondition = CCondition;