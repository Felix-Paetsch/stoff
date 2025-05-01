const joint_edit_data = {
    current_mode: null, // create, edit, remove
    current_joint_id: null
};

function add_new_joint() {
    document.getElementById("joint_change_overlay").style.display = "flex";
    document.getElementById("joint_edit_overlay_title").innerHTML = "Create new joint";
    joint_edit_data.current_mode = "create";
}

function submit_joint_create(){
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
            point2_id: id2
        })
    };
      
    fetch(`${frontend_vars.website_path}/requests/create_joint`, requestOptions)
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return _warn('Server error: ' + text);
        }

        const res = await response.json();
        create_join_card(res);
        close_all_overlays(null, true);
    })
    .catch(error => {
        _warn('Server error: ', error);
    });  
}

function create_join_card({ id, first_point, second_point }) {
    const cardHtml = `
      <div class="point_match_card" _id="${id}">
        <div class="point_match_card_name">
          <div _point_id="${first_point.id}" class="match_card_point">${first_point.name}</div>
          <div class="point_match_sep_div">-</div>
          <div _point_id="${second_point.id}" class="match_card_point">${second_point.name}</div>
        </div>
        <div class="toolbar">
          <i class="fa-regular fa-pen-to-square edit_icon" onclick="joint_edit_icon_clicked(event)"></i>
          <i class="fa-regular fa-trash delete_icon" onclick="joint_delete_icon_clicked(event)"></i>
        </div>
      </div>
    `;
    
    const pointMatchFlex = document.querySelector('#add_match');
    pointMatchFlex.insertAdjacentHTML('beforebegin', cardHtml);
}
  

function validate_joint_match(point1, point2) {
    const pointCards = document.querySelectorAll('.point_card');
    const pointNames = Array.from(pointCards).map(card => card.getAttribute('_name'));
  
    if (!pointNames.includes(point1) || !pointNames.includes(point2)) {
      return 'One point doesn\'t exist.';
    }
  
    if (point1 === point2) {
      return 'Points must be different.';
    }
  
    const point1Card = Array.from(pointCards).find(card => card.getAttribute('_name') === point1);
    const point2Card = Array.from(pointCards).find(card => card.getAttribute('_name') === point2);
  
    const point1Id = point1Card.getAttribute('_id');
    const point2Id = point2Card.getAttribute('_id');

    const pointMatchCards = document.querySelectorAll('.point_match_card');
    for (let i = 0; i < pointMatchCards.length; i++) {
        const matchPoints = pointMatchCards[i].querySelectorAll('.match_card_point');
        const matchPointIds = Array.from(matchPoints).map(p => p.getAttribute('_point_id'));
        if (matchPointIds.includes(point1Id) && matchPointIds.includes(point2Id)) {
            return 'Joint already exists.';
        }
    }

    return [point1Id, point2Id];
}

  
function submit_joint_change_clicked(){
    if (joint_edit_data.current_mode == "create"){
        return submit_joint_create();
    }
    if (joint_edit_data.current_mode == "change"){
        return submit_joint_change();
    }
}