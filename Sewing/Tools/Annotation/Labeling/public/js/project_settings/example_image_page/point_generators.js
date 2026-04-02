
function* rename_submit_func_generator() {
    const val = document.getElementById("rename_text_input").value;
    const _warn = (s) => {
        generic_warn("rename_error_display", s);
        console.log(s);
    };
    if (val.length < 3){
        _warn("Name should have at least 3 characters");
        yield false
    }

    if (val.length > 50){
        _warn("Name should have at most 50 characters");
        yield false
    }

    const card_css = yield true;
    const r = checkValidCardName(val, card_css);

    if (typeof r == "string"){
        _warn(r);
        yield false;
    }

    const { req_obj, request_path, on_ok } = yield true;

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            new_name: val,
            ...req_obj
        })
    };
      
    fetch(`${frontend_vars.website_path}${ request_path }`, requestOptions)
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                return _warn('Server error: ' + text);
            }

            const res = await response.json();
            on_ok(res);

            close_all_overlays(null, true);
        })
        .catch(error => {
            _warn('Server error: ', error);
        });  
}

function* delete_submit_func_generator() {
    const skip = yield;
    const _warn = (s) => {
        generic_warn("deletion_error_display", s);
        console.log(s);
    };
    
    if (!skip){
        const val = document.getElementById("delete_text_input").value;
        
        if (val !== active_data.to_type_on_delete){
            _warn("Please type in the correct characters");
            yield false;
        }
    }

    const { request_path, req_obj, on_ok } = yield true;

    // Make actual request to server
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req_obj)
    };

    fetch(`${frontend_vars.website_path}${ request_path }`, requestOptions)
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return _warn('Server error: ' + text);
        }
        
        on_ok();
        close_all_overlays(null, true);
    })
    .catch(error => {
        _warn('Server error: ' + error);
    }); 
}
