function joint_edit_icon_clicked(e){
    document.getElementById("joint_change_overlay").style.display = "flex";
    document.getElementById("joint_edit_overlay_title").innerHTML = "Change Joint";
    joint_edit_data.current_mode = "change";
    joint_edit_data.current_joint_id = e.target.parentNode.parentNode.attributes._id.value;
}

function submit_joint_change(){
    const point1 = document.querySelector('#first_joint_point_input').value;
    const point2 = document.querySelector('#second_joint_point_input').value;

    const _warn = (s) => {
        generic_warn("joint_change_error_display", s);
        console.log(s);
    };

    const validationResult = validate_joint_match(point1, point2);

    if (typeof validationResult == "string") {
        return _warn(validationResult);
    }

    const [id1, id2] = validationResult;

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            point1_id: id1,
            point2_id: id2,
            joint_id: joint_edit_data.current_joint_id
        })
    };
      
    fetch(`${frontend_vars.website_path}/requests/change_joint`, requestOptions)
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return _warn('Server error: ' + text);
        }

        const res = await response.json();

        const joint_cards = document.querySelectorAll(".point_match_card");
        for (let i = 0; i < joint_cards.length; i++){
            if (joint_cards[i].attributes._id.value == res.id){
                const point_divs = joint_cards[i].querySelectorAll(".match_card_point");
                point_divs[0].attributes._point_id.value = res.first_point.id;
                point_divs[0].innerText = res.first_point.name;
                point_divs[1].attributes._point_id.value = res.second_point.id;
                point_divs[1].innerText = res.second_point.name;
            }
        }

        close_all_overlays(null, true);
    })
    .catch(error => {
        _warn('Server error: ', error);
    });  
}

function joint_delete_icon_clicked(e){
    const id = e.target.parentNode.parentNode.attributes._id.value;
    fetch(`${frontend_vars.website_path}/requests/delete_joint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            joint_id: id
        })
    })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return console.log('Server error: ' + text);
        }

        const joint_cards = document.querySelectorAll(".point_match_card");
        for (let i = 0; i < joint_cards.length; i++){
            if (joint_cards[i].attributes._id.value == id){
                joint_cards[i].remove();
            }
        }
    })
    .catch(error => {
        console.log('Server error: ', error);
    });  
}