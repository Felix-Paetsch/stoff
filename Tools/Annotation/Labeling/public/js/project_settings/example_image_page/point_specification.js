const active_data = {
    "id": "",
    "to_type_on_delete": "",
    active_point_el: null,
    currently_active_setting: null
};

function point_edit_icon_clicked(e){
    active_data.currently_active_setting = "point";

    active_data.active_point_el = e.target.parentNode.parentNode;
    active_data.id = e.target.parentNode.parentNode.attributes._id.value;

    document.querySelector("#rename_dialog h4 .rename_text").textContent = "Rename Point:";
    generic_edit_icon_clicked(e);
}

function on_point_delete_ok() {
    const point_cards = document.querySelectorAll('.point_card');
    for (let i = 0; i < point_cards.length; i++) {
        if (point_cards[i].attributes._id.value == active_data.id){
            point_cards[i].remove();
        }
    }

    const matchPoints = document.querySelectorAll('.match_card_point');
    for (let i = 0; i < matchPoints.length; i++) {
        const pointId = matchPoints[i].getAttribute('_point_id');
        if (pointId === active_data.id) {
            matchPoints[i].parentNode.parentNode.remove();
        }
    }

    const img_points = document.querySelectorAll('.img_point');
    for (let i = 0; i < img_points.length; i++) {
        if (img_points[i].attributes._point_id.value == active_data.id){
            img_points[i].remove();
        }
    }
    
    image_point_data.present_point_ids = image_point_data.present_point_ids.filter(x => x !== active_data.id);
}

function point_delete_icon_clicked(e){
    active_data.currently_active_setting = "point";
    active_data.id = e.target.parentNode.parentNode.attributes._id.value;
    active_data.active_point_el = e.target.parentNode.parentNode;

    let name = generic_delete_icon_clicked(e, () => {
        const delete_func = delete_submit_func_generator();
        delete_func.next(); // SetUp
        delete_func.next(true); // Tell to skip validation
        delete_func.next({
            req_obj: {
                point_id: active_data.id
            },
            request_path: "/requests/delete_point",   
            on_ok: on_point_delete_ok
        }); // Submit Delete
    });

    active_data.to_type_on_delete = `delete::${ name }`;

    document.querySelector("#deletion_overlay h4 .delete_text").textContent = "Delete Point:";
}

function submit_rename(){
    if (active_data.currently_active_setting == "point"){
        return submit_point_rename();
    }
}

function submit_point_rename(){
    const rename_func = rename_submit_func_generator();

    // Check generic name errors
    if (!rename_func.next().value){ return; }
    
    // Check pattern match and if string already exists
    if (!rename_func.next(".point_card").value){
        return;
    }

    // Make actual request to server
    rename_func.next({
        req_obj: {
            point_id: active_data.id
        },
        request_path: "/requests/rename_point",
        on_ok: (response) => {
            const { id, name } = response;
            
            const elements = document.querySelectorAll('.point_card');

            elements.forEach((el) => {
              if (el.attributes._id && el.attributes._id.value === id) {
                const targetEl = el.querySelector('div:nth-child(1) > div:nth-child(2)');
                if (targetEl) {
                  targetEl.innerText = name;
                }
                el.attributes._name.value = name;
              }
            });

            const matchPoints = document.querySelectorAll('.match_card_point');
            for (let i = 0; i < matchPoints.length; i++) {
                const pointId = matchPoints[i].getAttribute('_point_id');
                if (pointId === id) {
                    matchPoints[i].textContent = name;
                }
            }
        }
    });
}

function submit_point_delete(){
    const delete_func = delete_submit_func_generator();
    delete_func.next(); // setup

    // Check the correct thing was typed
    if (!delete_func.next(false)){ return; }
    
    // Make delete request
    delete_func.next({
        request_path: "/requests/delete_point",
        req_obj: {
            point_id: active_data.id
        },
        on_ok: on_point_delete_ok
    });
}

function submit_delete(){
    if (active_data.currently_active_setting == "point"){
        return submit_point_delete();
    }
}