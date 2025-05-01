async function add_new_point() {
    const cards = document.querySelectorAll('.point_card');
    const existingNames = [];
  
    // Loop through each card and add its name to the existingNames array
    for (let i = 0; i < cards.length; i++) {
      const name = cards[i].attributes._name.value;
      existingNames.push(name);
    }
  
    // Find a unique name for the new project
    let newName = 'New Point';
    let i = 1;
    while (existingNames.includes(newName)) {
      newName = `New Point (${i})`;
      i++;
    }
  
    console.log(`New Point name: ${newName}`);
  
    try {
      // Make a POST request to create a new project
      const response = await fetch(`${frontend_vars.website_path}/requests/create_point`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            project_id: frontend_vars.project_id,
            name: newName,
            color: provide_new_point_color()
        })
      });
      const data = await response.json();
  
      // Extract the project name and ID from the response data
      const { point_name, point_id, point_color } = data;
      console.log(data);
  
      // Create a new project card element
      const newCard1 = create_point_card( point_name, point_id, point_color, false );
      const newCard2 = create_point_card( point_name, point_id, point_color, true );
  
      // Add the new card element before the #new_project element
      const newPointDivs = document.getElementsByClassName('add_point');
      newPointDivs[0].parentNode.insertBefore(newCard1, newPointDivs[0]);

      newPointDivs[1].parentNode.insertBefore(newCard2, newPointDivs[1]);
  
      image_point_data.present_point_ids.push(point_id);

      console.log(`Created new imageset with name ${point_name} and ID ${point_id}`);

      newCard1.querySelector(".edit_icon").click();
    } catch (err) {
      console.error('Error creating new point:', err);
    }
}

function create_point_card(name, id, color, is_bottom){
    const htmlString = `<div class="point_card" _name="${ name }" _id="${ id }" ${ is_bottom ? 'onclick="activate_point_to_click(this)"' : ""}>
        <div>
            <div class="point_color" _color="${ color }" style="background: ${ color }"></div>
            <div>${ name }</div>
        </div>
        <div class="toolbar">
            <i class="fa-regular fa-pen-to-square edit_icon" onclick="point_edit_icon_clicked(event)"></i>
            <i class="fa-regular fa-trash delete_icon" onclick="point_delete_icon_clicked(event)"></i>
        </div>
    </div>
    `;

    // Create a temporary div element
    const tempDiv = document.createElement('div');

    // Set the HTML string as the content of the temporary div
    tempDiv.innerHTML = htmlString;

    // Get the first child element of the temporary div (which is the <div> element we want)
    return tempDiv.firstChild;
}