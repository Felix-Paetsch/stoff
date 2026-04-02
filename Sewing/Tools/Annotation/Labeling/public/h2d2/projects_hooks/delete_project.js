function delete_project(){
    const project_id = document.getElementById("delete_section").getAttribute("data-project-id");
    
    fetch('/delete_project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error){
            const e = document.getElementById("create_project_modal_error");
            e.textContent = data.error_value;
            e.classList.add("show");

            return;
        }
        
        console.log('Project Deleted:', data);
        window.location.reload();
    })
    .catch(error => console.error('Error:', error));
}
