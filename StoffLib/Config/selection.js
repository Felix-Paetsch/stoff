import ChildrenHaving from "./_chilren_having.js";
import ConfigElement from "./_config_element.js";

// Holds an array of choices from which arbitrarily many can be selected

export default class CSelection extends ChildrenHaving{
    constructor(name, ...children){
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)
        
        const last_el = children[children.length - 1];
        let activated = false;
        if (Array.isArray(last_el) && children.length > 1){
            children.pop();
            activated = last_el;
        } else {
            activated = [];
        }

        super(name, children);
        this.activated = activated;
    }

    activate(i){
        if (this.activated.includes(i)){
            return this;
        }
        this.activated.push(i);
        this.activated.sort();
        this.changed();
        return this;
    }

    deactivate(i){
        if (!this.activated.includes(i)){
            return this;
        }

        this.activated = this.activated.filter(x => x !== i);
        this.changed();
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
            "children": this.serialize_children(),
            "active_children": this.activated,
            id: this.id
        }
    }

    static deserialize(data){
        const cs = new CSelection(
            data["name"],
            ChildrenHaving.serialize_children(data["children"])
        ).set_id(data.id);

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

    on_dom_load(own_path){
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