import ConfigElement from "./_config_element.js";

// Holds an array of choices from which at most one can be selected

export default class COption extends ConfigElement{
    constructor(name, ...children){
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)

        super(name);
        
        this.selected = 0;

        const last_el = children[children.length - 1];
        if (Number.isInteger(last_el) && children.length > 1){
            children.pop();
            this.selected = last_el;
        }

        this.children = ConfigElement.as_unfolded_components(children);
        this.assert(this.children.length > 0, "Option must have at least one child");
    }

    select(i){
        this.selected = Math.max(
            0,
            Math.min(
                i, 
                this.children.length
            )
        );

        return this;
    }

    serialize(){
        return {
            "name": this.name,
            "type": "COption",
            "children": this.children.map((c) => c.serialize()),
            "selected": this.selected
        }
    }

    static deserialize(data){
        const co = new COption(
            data["name"],
            data["children"].map(c => ConfigElement.deserialize_component(c)),
            data["selected"]
        );

        return co;
    }

    to_obj(){
        return this.children[this.selected].to_obj();
    }

    /* frontend stuff  */

    render(dir, own_path){
        return this._dev_render("option_component.ejs", dir, own_path);
    }

    add_interaction_events(own_path){
        const option_element = this.get_by_path(own_path);

        this.children.forEach(
            (c, i) => {
                const child = this.get_by_path([...own_path, i]);
                const clickable = child.parentElement.parentElement;
                clickable.addEventListener(
                    "mousedown",
                    () => {
                        this.select(i);
                        request_img();

                        const circle_elements = option_element.querySelectorAll(".fa-circle");
                        for (const ce of circle_elements){
                            ce.classList.remove("hidden");
                        }
                        
                        const circle_check_elements = option_element.querySelectorAll(".fa-circle-check");
                        for (const cce of circle_check_elements){
                            cce.classList.add("hidden");
                        }

                        clickable.querySelector(".fa-circle-check").classList.remove("hidden");
                        clickable.querySelector(".fa-circle").classList.add("hidden");
                    }
                )
            }
        );
    }
}

ConfigElement.classDecendents.COption = COption;