export default class SComponent{
    constructor(name, default_value = null, children){
        this.name = name;
        this.default_value = default_value;
        this.value = default_value;
        this.children = children;
    }

    is_valid(){
        for (const c of this.children){
            if (!c.is_valid()) return false;
        }
        return true;
    }

    valid_con(valid_con_fun){
        this.is_valid = () => {
            return valid_con_fun() && this.is_valid();
        }
        return this;
    }

    action_is_valid(action){
        return true
    }

    set(value){
        this.value = value;
        return this.value;
    }
}