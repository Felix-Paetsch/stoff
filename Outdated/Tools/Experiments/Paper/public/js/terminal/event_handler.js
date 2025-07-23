class Event_Handler{
    constructor(){
        this.mouse_pos = [null, null];

        this.scrolled_to_top = false;
        this.scrollY = 0;

        document.addEventListener("keydown", ((e) => {
            const { target, key } = e;
            this.emmit(new Action(`key_down::${ e.key }`, {
                target,
                key,
                mouse_pos: this.mouse_pos,
                key_event: true,
                event_type: "key_down"
            }));
        }).bind(this));

        document.addEventListener("keyup", ((e) => {
            const { target, key } = e;
            this.emmit(new Action(`key_up::${ e.key }`, {
                target,
                key,
                mouse_pos: this.mouse_pos,
                key_event: true,
                event_type: "key_up"
            }));
        }).bind(this));

        document.addEventListener("mousemove", (e) => {
            this.mouse_pos = [e.clientX, e.clientY]; // Relative to current window
        });

        document.addEventListener("DOMContentLoaded", (e) => {
            this.emmit(new Action("DOMContentLoaded"));
        });

        window.addEventListener('load', (e) => {
            this.emmit(new Action("on_window_load"));
        });

        window.addEventListener('resize', (e) => {
            this.emmit(new Action("on_window_resize"));
        });

        window.addEventListener('scroll', ((e) => {
            if (window.scrollY === 0) {
                this.scrolled_to_top = true;
            } else {
                this.scrolled_to_top = false;
            }
            this.scrollY = window.scrollY;
            this.emmit(new Action("window_scroll", {
                scrolled_to_top: this.scrolled_to_top,
                scrollY: this.scrollY
            }));
        }).bind(this));

        this.actions = {};
    }

    after_dom_loaded(fun){
        this.subscribe("DOMContentLoaded", fun);
    }

    on_window_load(fun){
        this.subscribe("on_window_load", fun);
    }

    on_window_resize(fun){
        this.subscribe("on_window_resize", fun);
    }

    subscribe(action_name, func, options = {}){
        /*
            options = {
                once: bool,
                max: int,
                only_on_top: bool
            }
        */

        if (!this.actions[action_name]){
            this.actions[action_name] = [];
        }

        this.actions[action_name].push({ func, options });
    }

    emmit(action){
        const fun_arr = this.actions[action.get_action_name()];
        if (fun_arr){
            const rem_indices = [];

            for (let i = 0; i < fun_arr.length; i++){
                const { func, options } = fun_arr[i];

                if (
                    typeof options.only_on_top == "boolean"
                    && options.only_on_top
                    && !this.scrolled_to_top
                ){
                    continue;
                }

                func(action);

                if (typeof options.max == "number"){
                    options.max -= 1;
                }

                if (
                    (typeof options.max == "number" && options.max == 0)
                    || (typeof options.once == "boolean" && options.once)
                ){
                    rem_indices.unshift(i);
                }
            }

            rem_indices.forEach(index => {
                if (index >= 0 && index < fun_arr.length) {
                    fun_arr.splice(index, 1);
                }
            });
        }
    }

    add_keydown(key, fun){
        this.subscribe(`key_down::${ key }`, fun);
    }

    add_keyup(key, fun){
        this.subscribe(`key_up::${ key }`, fun);
    }
}

class Action{
    constructor(action_name, action_data = {}){
        this.action_name = action_name;
        this.data = action_data;
    }

    get_data(){
        return this.data;
    }

    get_action_name(){
        return this.action_name
    }

    as_string(){
        return `<Action::${ this.action_name }>`;
    }
}

const event_handler = new Event_Handler();