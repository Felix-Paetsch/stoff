const config_data = {};

document.addEventListener("DOMContentLoaded", () => {
    initialize_config_data();
    request_img();
});

function initialize_config_data(){
    const config_components = document.querySelectorAll(".design_config_component");
    for (const c of config_components){
        const c_name = c.getAttribute("x-component-name");
        config_data[c_name] = {};
        const conf_children = c.querySelectorAll(".param_box");
        for (const config_child of conf_children){
            if (config_child.classList.contains("param_boolean")){
                init_bool(config_child, config_data[c_name]);
            }
            else if (config_child.classList.contains("param_number")){
                init_number(config_child, config_data[c_name])
            }
        }
    }
}

function init_bool(c, data_obj){
    const attr_name = c.getAttribute("x-name");
    data_obj[attr_name] = c.getAttribute("x-default-value") == "true";

    const checkbox = c.querySelector(".boolean_checkbox");
    checkbox.addEventListener("click", () => {
        const new_state = !data_obj[attr_name];
        data_obj[attr_name] = new_state;
        if (new_state){
           checkbox.querySelector(".fa-hexagon").classList.add("hidden"); 
           checkbox.querySelector(".fa-hexagon-check").classList.remove("hidden");
        } else {
            checkbox.querySelector(".fa-hexagon").classList.remove("hidden"); 
            checkbox.querySelector(".fa-hexagon-check").classList.add("hidden");
        }
        request_img();
    });
}

function init_number(c, data_obj){
    const attr_name = c.getAttribute("x-name");
    data_obj[attr_name] = +c.getAttribute("x-default-value");

    const input = c.querySelector('input[type="range"]');
    input.addEventListener("input", () => {
        c.querySelector(".numper_input_value").textContent = input.value;
        data_obj[attr_name] = +input.value;
        request_img();
    });
}


{
    document.addEventListener('DOMContentLoaded', function(event) {
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(function(input) {
            const defaultValue = input.getAttribute('value');
            input.value = defaultValue;
        });
    });
}