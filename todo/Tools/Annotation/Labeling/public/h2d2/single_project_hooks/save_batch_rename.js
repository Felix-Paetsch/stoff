function save_project_rename(){
    const edit_el = document.getElementById("project_edit_input");
    const id = edit_el.getAttribute("data-project-id");
    const value = edit_el.value;

    fetch('/rename_batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            batch_id: id, batch_name: value
         })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error){
            const e = document.getElementById("edit_project_modal_error");
            e.textContent = data.error_value;
            e.classList.add("show");

            return;
        }
        
        console.log('Batch Renamed:', data);
        window.location.reload();
    })
    .catch(error => console.error('Error:', error));
}
