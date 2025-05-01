const active_project_data = {
    "id": "",
    "to_type_on_delete": "",
    active_project_el: null
};

function edit_icon_clicked(e){
    active_project_data.active_project_el = e.target.parentNode.parentNode;
    active_project_data.id = e.target.parentNode.parentNode.attributes._id.value;

    document.querySelector("#rename_dialog h4 .rename_text").textContent = "Rename project:";
    generic_edit_icon_clicked(e);
}

function delete_icon_clicked(e){
    active_project_data.id = e.target.parentNode.parentNode.attributes._id.value;
    active_project_data.active_project_el = e.target.parentNode.parentNode;

    let name = generic_delete_icon_clicked(e, make_delete_request);
    active_project_data.to_type_on_delete = `delete::${ name }`;

    document.querySelector("#deletion_overlay h4 .delete_text").textContent = "Delete project:";
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
          project_id: active_project_data.id,
          new_name: val
        })
    };
      
    fetch(`${frontend_vars.website_path}/requests/rename_project`, requestOptions)
    .then(async response => {
        if (!response.ok) {
            const text = await response.text();
            return _warn('Server error: ' + text);
        }
        
        active_project_data.active_project_el.attributes._name.value = val;
        active_project_data.active_project_el.getElementsByClassName("name_div")[0].innerText = val;
        
        const cards = document.querySelectorAll(".editable_card");
        for (let i = 0; i < cards.length; i++) {
            if (cards[i].attributes._id.value == active_project_data.id){
                cards[i].querySelector("a").href = `${frontend_vars.website_path}/p/${ val }`
            }
        }
        
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
    // Make actual request to server
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            project_id: active_project_data.id
        })
    };

    fetch(`${frontend_vars.website_path}/requests/delete_project`, requestOptions)
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

async function add_new_project() {
    const animalCards = document.querySelectorAll('.editable_card');
    const existingNames = [];
  
    // Loop through each card and add its name to the existingNames array
    for (let i = 0; i < animalCards.length; i++) {
      const name = animalCards[i].attributes._name.value;
      existingNames.push(name);
    }
  
    // Find a unique name for the new project
    let newName = 'New project';
    let i = 1;
    while (existingNames.includes(newName)) {
      newName = `New project (${i})`;
      i++;
    }
  
    console.log(`New project name: ${newName}`);
  
    try {
      // Make a POST request to create a new project
      const response = await fetch(`${frontend_vars.website_path}/requests/create_project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_name: newName })
      });
      const data = await response.json();
  
      // Extract the project name and ID from the response data
      const { project_name, project_id } = data;
      console.log(data);
  
      // Create a new project card element
      const newCard = create_editable_card({
        name: project_name,
        div_string: `
            onmouseover='document.getElementById("example_img").src = this.attributes._example_image_path.value'
            _name="${ project_name }"
            _id="${ project_id }"
            _example_image_path="${frontend_vars.website_path}/images/project_default_img.svg"
        `,
        href_suffix: `/p/${ encodeURIComponent(project_name) }`
      });
  
      // Add the new card element before the #new_project element
      const newProjectDiv = document.getElementById('new_project');
      newProjectDiv.parentNode.insertBefore(newCard, newProjectDiv);
  
      console.log(`Created new project with name ${project_name} and ID ${project_id}`);

      newCard.querySelector(".edit_icon").click();
    } catch (err) {
      console.error('Error creating new project:', err);
    }
}  