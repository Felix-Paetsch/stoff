import ConfigElement from "./_config_element.js";

// Holds an array of choices from which arbitrarily many can be selected

export default class CSelection extends ConfigElement{
    constructor(name, ...children){
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)

        super(name);
        
        const last_el = children[children.length - 1];
        if (Array.isArray(last_el) && children.length > 1){
            children.pop();
            this.activated = last_el;
        } else {
            this.activated = [];
        }

        this.children = ConfigElement.as_unfolded_components(children);
    }

    activate(i){
        if (this.activated.includes(i)){
            return this;
        }
        this.activated.push(i);
        this.activated.sort();
        return this;
    }

    deactivate(i){
        this.activated = this.activated.filter(x => x !== i);
        return this;
    }

    is_active(i){
        return this.activated.includes(i);
    }

    toggle(i){
        return this.is_active(i) ? this.deactivate(i) : this.activate(i);
    }

    serialize(){
        return {
            "name": this.name,
            "type": "CSelection",
            "children": this.children.map((c) => c.serialize()),
            "active_children": this.activated
        }
    }

    static deserialize(data){
        const cs = new CSelection(
            data["name"],
            data["children"].map(c => ConfigElement.deserialize_component(c))
        );

        data["active_children"].forEach(i => {
            cs.activate(i);
        });

        return cs;
    }

    to_obj(){
        return this.activated.map(
            i => this.children[i].to_obj()
        );
    }

    /* frontend stuff  */

    render(dir, own_path){
        return this._dev_render("selection_component.ejs", dir, own_path);
    }

    add_interaction_events(own_path){
        this.children.forEach(
            (c, i) => {
                const child = this.get_by_path([...own_path, i]);
                const clickable = child.parentElement.parentElement;
                clickable.addEventListener(
                    "mousedown",
                    () => {
                        this.toggle(i);
                        request_img();

                        clickable.querySelector(".fa-square-check").classList.toggle("hidden");
                        clickable.querySelector(".fa-square").classList.toggle("hidden");
                        
                    }
                )
            }
        );
    }
}

ConfigElement.classDecendents.CSelection = CSelection;