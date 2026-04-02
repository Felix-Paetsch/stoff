const image_point_data = {
    active_point: null,
    present_point_ids: []
}

const image_point_handling_point_cards = document.querySelectorAll(".point_card")

for (let i = 0; i < image_point_handling_point_cards.length; i++){
    image_point_data.present_point_ids.push(image_point_handling_point_cards[i].attributes._id.value);
}

image_point_data.present_point_ids = image_point_data.present_point_ids.filter(function(item, index) {
    return image_point_data.present_point_ids.indexOf(item) === index;
});

set_up_img_points();

document.addEventListener("click", (e) => {
    function hasAncestorWithId(element) {
        let currentElement = element;
        while (currentElement != null) {
          if (currentElement.id === "point_setting_flex") {
            return true;
          }
          currentElement = currentElement.parentElement;
        }
        return false;
    }
    
    if (hasAncestorWithId(e.target)){
        return;
    }

    clean_up_active_points();
});

function set_up_img_points(){
    try {
        const data = JSON.parse(frontend_vars.ex_img);
        if (typeof data.points !== "object") data.points = [];
        for (let i = 0; i < data.points.length; i++){
            const point_cards = document.querySelectorAll(".point_card");
            for (let j = 0; j < point_cards.length; j++){
                if (point_cards[j].attributes._id.value == data.points[i].point_id){
                    image_point_data.active_point = point_cards[j]
                }
            }
 
            create_img_point_at_position(
                data.points[i].heightPercent,
                data.points[i].widthPercent,
                data.points[i].point_id
            )
        }
    } catch(e) {
        console.log("Problem with ex_img_data")
    }
}


function clean_up_active_points(){
    const to_remove_els = document.querySelectorAll(".point_placable_in_img");
    for (let i = 0; i < to_remove_els.length; i++){
        to_remove_els[i].classList.remove("point_placable_in_img");
    }
    image_point_data.active_point = null;
}

function activate_point_to_click(el){
    clean_up_active_points();
    el.classList.add("point_placable_in_img");
    image_point_data.active_point = el;
}

function remove_img_points_with_id(id){
    const p = document.querySelectorAll(".img_point");
    for (let i = 0; i < p.length; i++){
        if (p[i].getAttribute("_point_id") == id){
            p[i].remove();
        }
    }
}

function create_img_point_at_position(heightPercent, widthPercent, point_id){
    const imageInnerWrapper = document.getElementById('image_inner_wrapper');
    const newDiv = document.createElement('div');
    newDiv.style.backgroundColor = image_point_data.active_point.querySelector(".point_color").getAttribute("_color");
    newDiv.style.width = `calc(2* ${ frontend_vars.point_radius })`;
    newDiv.style.height = `calc(2* ${ frontend_vars.point_radius })`;
    newDiv.style.borderRadius = `calc(2* ${ frontend_vars.point_radius })`;
    newDiv.style.borderWidth = `${ frontend_vars.point_boder_width }`;
    newDiv.style.top = `calc(${ heightPercent }% - ${ frontend_vars.point_radius })`;
    newDiv.style.left = `calc(${ widthPercent }% - ${ frontend_vars.point_radius })`;
    newDiv.setAttribute("_point_id", point_id);
    newDiv.classList.add("img_point");
    imageInnerWrapper.appendChild(newDiv);
}

function img_click_event(e){
    if (!image_point_data.active_point || image_point_data.present_point_ids.indexOf(image_point_data.active_point.attributes._id.value) < 0){
        return;
    }

    // Get the image element
    const img = e.target;

    // Get the position of the click relative to the image's top-left corner
    const x = e.offsetX;
    const y = e.offsetY;

    // Calculate the percentage of the width and height where the click happened
    const widthPercent = (x / img.width) * 100;
    const heightPercent = (y / img.height) * 100;
    console.log(`Point positioned at: ${widthPercent}% width, ${heightPercent}% height`);

    // Make post request

    // Remove old point
    point_id = image_point_data.active_point.getAttribute("_id");
    remove_img_points_with_id(point_id);
    
    create_img_point_at_position(heightPercent, widthPercent, point_id);

    fetch(`${frontend_vars.website_path}/requests/set_example_img_point`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            project_id: frontend_vars.project_id,
            point_id,
            widthPercent,
            heightPercent
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