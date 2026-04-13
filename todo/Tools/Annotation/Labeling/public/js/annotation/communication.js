function _upload_data_to_server(){
    fetch(`/requests/upload_all_annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            img_data: iter_images().map(i => i.to_img_data()),
            imgBatchId: frontend_vars.img_batch_id,
            project_id: frontend_vars.project_id,
            annotation_start: frontend_vars.annotation_start
        })
    })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            console.log('Server error: ' + text);
            alert("Server Error, you will be logged out.");
            window.location.href = "/error";

            return
        }

        const redirect = response.headers.get("hx-redirect");
        if (redirect){
            window.location.assign(redirect);
        }
    })
    .catch(error => {
        console.log('Server error: ', error);
        alert("Server Error, you will be logged out.");
        window.location.href = "/error";
    });  
}

function _check_still_current_user(){
    fetch(`${frontend_vars.website_path}/requests/still_current_user/${ frontend_vars.project_id }/${ frontend_vars.img_batch_id }/${ frontend_vars.annotation_start }`, {
        method: 'GET'
    })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return console.log('Server error: ' + text);
        }

        const redirect = response.headers.get("hx-redirect");
        if (redirect){
            window.location.assign(redirect);
        }
    })
    .catch(error => {
        console.log('Server error: ', error);
    });
}

const upload_data_to_server = throttle_func(guard_editing(_upload_data_to_server), frontend_vars.upload_func_min_interval_in_s);
const check_still_current_user = guard_editing(_check_still_current_user);

setInterval(upload_data_to_server, frontend_vars.upload_interval_in_s * 1000);
setInterval(check_still_current_user, frontend_vars.current_user_check_interval_s * 1000);