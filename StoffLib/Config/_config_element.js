import render_file_sync from "./utils/rendering.js";
import load_lib from "./utils/load_lib.js";

import { assert } from "../../Debug/validation_utils.js";
const path = await load_lib("path");

export default class ConfigElement{
    constructor(name = null){
        this.assert(name == null || typeof name == "string", "Name must be a string or null.");
        this.name = name;
        this.id = ConfigElement.uid();

        this.on_change_fun = [];
    }

    static classDecendents = { ConfigElement };

    static set_if_unset(thing, key, value){
        if (typeof thing[key] == "undefined"){
            thing[key] = value;
        }

        return thing[key];
    }

    set_name(name){
        this.name = name;
        return this;
    }

    set_id(id){
        this.id = id;
        return this;
    }

    init(conf){}

    throw(text){
        throw new Error("There was a configuration error: \n" + text);
    }

    assert(bool, text = "<not further specified>"){
        if (!bool){
            this.throw(text);
        }
    }

    static to_component(thing){
        if (thing instanceof ConfigElement){
            return thing;
        }

        if (typeof thing === 'string'){
            return new ConfigElement.classDecendents.CStatic(thing);
        }

        if (thing instanceof Array){
            return new ConfigElement.classDecendents.CContainer(thing);
        }

        if (thing instanceof Object){
            const arr = [];

            for (const key in thing){
                arr.push(new ConfigElement.classDecendents.CContainer(key, thing[key]));
            }

            return new ConfigElement.classDecendents.CContainer(arr);
        }

        throw new Error("Currently uninplemented");
    }

    static deserialize_component(c){
        assert(c.type in ConfigElement.classDecendents, "Object is not a valid component serialization.");
        return ConfigElement.classDecendents[c.type].deserialize(c);
    }

    static unfold_elements(arr){
        const final_els = [];
        for (const el of arr){
            if (el instanceof Array){
                final_els.push(...el);
            } else {
                final_els.push(el);
            }
        }

        return final_els;
    }

    static as_unfolded_components(arr){
        return ConfigElement.unfold_elements(arr).map(el => ConfigElement.to_component(el));
    }

    serialize(){
        throw new Error("Serialization of component uninplemented");
    }

    static deserialize(){
        throw new Error("Deserialization of component uninplemented");
    }

    to_obj(){
        throw new Error("`to_obj` for component uninplemented");
    }

    get_by_id(id){
        if (this.id == id){
            return this;
        }

        return undefined;
    }

    get_by_name(name){
        if (this.name == name){
            return [name];
        }

        return [];
    }

    on_change(fun){
        this.on_change_fun.push(fun);
    }

    changed(){
        for (const fun of this.on_change_fun){
            fun();
        }

        if (this.parent){
            this.parent.changed();
        }
    }

    /* Only for rendering */

    render(){
        throw new Error("Rendering of component uninplemented");
    }


    _dev_render(rel_file_path, dir, own_path){
        return render_file_sync(
            path.join(dir, rel_file_path),
            {
                ...this,
                t: this,
                dir,
                own_path,
                serialized_path: ConfigElement.serialize_path(own_path)
            }
        )
    }

    get_by_path(path){
        const serialized_path = ConfigElement.serialize_path(path);
        return document.querySelector(`[x-component-path="${ serialized_path }"]`);
    }

    static serialize_path(pArr){
        return pArr.map(String).join("-")
                    .replace(/\\/g, "\\\\")
                    .replace(/\n/g, "\\n")
                    .replace(/"/g, "\\\"");
    }
}

ConfigElement.uid = (() => {
    function* uidGenerator() {
        let id = 0;
        while (true) {
        yield `_uid_${id++}`;
        }
    }

    const gen = uidGenerator();
    return () => {
        return gen.next().value
    }
})()