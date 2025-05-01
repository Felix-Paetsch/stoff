function close_all_overlays(e, force = false){
    if (!force && !e.target.classList.contains("close_overlay_onclick")) return;

    const overlay_objects = document.getElementsByClassName("hide_on_overlay_close");
    for (let i = 0; i < overlay_objects.length; i++){
        overlay_objects[i].style.display = "none";
    }
}

function generic_edit_icon_clicked(e){
    const name = e.target.parentNode.parentNode.attributes._name.value;
   
    document.getElementById("rename_overlay").style.display="flex";
    document.getElementById("rename_text_input").value="";
    document.getElementById("rename_italic_name").innerText = ` \`${ name }\` `;

    return name;
}

function generic_delete_icon_clicked(e, on_shift){
    const name = e.target.parentNode.parentNode.attributes._name.value;

    if (e.shiftKey) {
        return on_shift();
    }
   
    document.getElementById("deletion_overlay").style.display="flex";
    document.getElementById("delete_italic_name").innerText = ` \`${ name }\` `;
    document.getElementById("delete_text_input").value="";
    document.getElementById("delete_text_input").placeholder=`delete::${ name }`;
    document.getElementById("to_delete_text").innerText = ` \`delete::${ name }\` `;

    return name;
}

function generic_warn(item, s){
    const w = document.getElementById(item);
    w.style.display = "block";
    w.innerText = s;
}

function checkValidCardName(inputName, cards_css = ".editable_card") {

    const animalCards = document.querySelectorAll(cards_css);
  
    for (let i = 0; i < animalCards.length; i++) {
      const cardName = animalCards[i].getAttribute('_name').toLowerCase();
  
      if (cardName === inputName.toLowerCase()) {
        return "Name already exists";
      }
    }
  
    const validChars = /^[a-zA-Z0-9\/\[\]\(\)\:\+_\ #]+$/;

    if (!validChars.test(inputName)){
        return `The name may only contain characters \nfrom the set\`_ a-zA-Z0-9[]()/:+#\`"`
    }

    return true;
}

function create_editable_card({ div_string, name, href_suffix }){
    const htmlString = `<div 
        class="editable_card" 
        ${ div_string }
    >
        <a class="name_div" href="${frontend_vars.website_path}${ href_suffix }">${ name }</a>
        <div class="toolbar">
            <i class="fa-regular fa-pen-to-square edit_icon" onclick="edit_icon_clicked(event)"></i>
            <i class="fa-regular fa-trash delete_icon" onclick="delete_icon_clicked(event)"></i>
        </div>
    </div>`;

    // Create a temporary div element
    const tempDiv = document.createElement('div');

    // Set the HTML string as the content of the temporary div
    tempDiv.innerHTML = htmlString;

    // Get the first child element of the temporary div (which is the <div> element we want)
    return tempDiv.firstChild;
}