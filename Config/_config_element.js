export default class ConfigElement{
    constructor(name = null){
        this.assert(name == null || typeof name == "string", "Name must be a string or null.");
        this.name = name;
    }

    set_if_unset(thing, key, value){
        if (typeof thing[key] == "undefined"){
            thing[key] = value;
        }

        return thing[key];
    }

    throw(text){
        throw new Error("There was a configuration error: \n" + text);
    }

    assert(bool, text = "<not further specified>"){
        if (!bool){
            this.throw(text);
        }
    }

    to_component(thing){
        if (thing instanceof ConfigElement.prototype.classDecendents.ConfigElement){
            return thing;
        }

        if (typeof thing === 'string'){
            return new ConfigElement.prototype.classDecendents.CStatic(thing);
        }

        if (thing instanceof Array){
            return new ConfigElement.prototype.classDecendents.CContainer(thing);
        }

        if (thing instanceof Object){
            const arr = [];

            for (const key in thing){
                arr.push(new ConfigElement.prototype.classDecendents.CContainer(key, thing[key]));
            }

            return new ConfigElement.prototype.classDecendents.CContainer(arr);
        }

        throw new Error("Currently uninplemented");
    }

    unfold_elements(arr){
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

    as_unfolded_components(arr){
        return this.unfold_elements(arr).map(el => this.to_component(el));
    }
}

ConfigElement.prototype.classDecendents = {
    ConfigElement
};