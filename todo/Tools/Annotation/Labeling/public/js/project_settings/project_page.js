const active_project_data = {
    "id": "",
    "to_type_on_delete": "",
    active_project_el: null
};

function edit_icon_clicked(e){
    active_project_data.active_project_el = e.target.parentNode.parentNode;
    active_project_data.id = e.target.parentNode.parentNode.attributes._id.value;

    document.querySelector("#rename_dialog h4 .rename_text").textContent = "Rename Imageset:";
    generic_edit_icon_clicked(e);
}

function delete_icon_clicked(e){
    let name = generic_delete_icon_clicked(e, make_delete_request);
    active_project_data.to_type_on_delete = `delete::${ name }`;
    active_project_data.id = e.target.parentNode.parentNode.attributes._id.value;
    active_project_data.active_project_el = e.target.parentNode.parentNode;

    document.querySelector("#deletion_overlay h4 .delete_text").textContent = "Delete Imageset:";
}

function submit_rename(){
    const val = document.getElementById("rename_text_input").value;

    const _warn = (s) => generic_warn("rename_error_display", s);

    if (val.length < 3){
        return _warn("Name should have at least 3 characters");
    }

    if (val.length > 50){
        return _warn("Name should have at most 50 characters");
    }

    const r = checkValidCardName(val);

    if (typeof r == "string"){
        return _warn(r);
    }

    // Make actual request to server
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          img_set_id: active_project_data.id,
          new_name: val
        })
    };
      
    fetch(`${frontend_vars.website_path}/requests/rename_imageset`, requestOptions)
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return _warn('Server error: ' + text);
        }
        
        active_project_data.active_project_el.attributes._name.value = val;
        active_project_data.active_project_el.getElementsByClassName("name_div")[0].firstElementChild.innerText = val;

        close_all_overlays(null, true);
    })
    .catch(error => {
        _warn('Server error: ', error);
    });  
}

function submit_delete(){
    const val = document.getElementById("delete_text_input").value;
    const _warn = (s) => generic_warn("deletion_error_display", s);

    if (val !== active_project_data.to_type_on_delete){
        return _warn("Please type in the correct characters");
    }
      
    make_delete_request();
}

function make_delete_request(){
    const _warn = (s) => generic_warn("deletion_error_display", s);

    // Make actual request to server
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            img_set_id: active_project_data.id
        })
    };

    fetch(`${frontend_vars.website_path}/requests/delete_image_set`, requestOptions)
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return _warn('Server error: ' + text);
        }
        
        active_project_data.active_project_el.remove();

        close_all_overlays(null, true);
    })
    .catch(error => {
        _warn('Server error: ' + error);
    }); 
}