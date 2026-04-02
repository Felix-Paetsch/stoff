// HTML && Getter
function get_all_elements_of_path_with_property(path, property_name, property_value){
    const els = document.querySelectorAll(path);
    const return_els = [];

    for (el of els){
        if (el.getAttribute(property_name) === property_value){
            return_els.push(el);
        }
    }

    return return_els;
}

function some_parent_has_id(el, id){
    if (el.id == id) return true;
    if (!el.parentElement) return false;
    return some_parent_has_id(el.parentElement, id);
}

function some_parent_has_class(el, css_class){
    if (el.classList.contains(css_class)) return true;
    if (!el.parentElement) return false;
    return some_parent_has_class(el.parentElement, css_class);
}

// needed
function get_img_id_from_index(index){
    return frontend_vars.img_data[index].id;
}

function get_id_via_child_element(el) {
    if (el.getAttribute("_id")) {
        return el.getAttribute("_id");
    } else if (el.parentElement) {
        return get_id_via_child_element(el.parentElement);
    } else {
        throw new Error("No _id found in element hierarchy.");
    }
}

function get_img_batch_id(){
    return frontend_vars.img_batch_id
}

function get_img_from(id){
    return images.filter(i => i.id == id)[0]
}

function get_img_index_from_id(id){
    for (let i = 0; i < frontend_vars.img_data.length; i++){
        if (frontend_vars.img_data[i].id == id){
            return i;
        }
    }
}

// Iterator

function iter_images(){
    return images;
}

// CSS

function change_classes(el, to_remove_classes, to_add_classes){
    remove_classes(el, to_remove_classes);
    add_classes(el, to_add_classes);
}

function remove_classes(el, classs){
    for (c of classs){
        el.classList.remove(c)
    }
}

function add_classes(el, classs){
    for (c of classs){
        el.classList.add(c)
    }
}

// Other

function throttle_func(func, interval_in_s) {
    let lastTimeCalled = null;
    let is_pending = false;

    function callback(){
        if (!is_pending){ // Via Force
            return;
        }
        execute();
    }

    function execute(){
        lastTimeCalled = Date.now();
        is_pending = false;
        func();
    }

    return function wrapper(forceCall = false) {
        const currentTime = Date.now();
        
        if (forceCall){
            return execute();
        }

        if (is_pending){
            return;
        }

        if (!lastTimeCalled || currentTime - lastTimeCalled >= interval_in_s * 1000) {
            return execute();
        }

        is_pending = true;
        setTimeout(callback, (interval_in_s * 1000) - (currentTime - lastTimeCalled));
    };
}
  