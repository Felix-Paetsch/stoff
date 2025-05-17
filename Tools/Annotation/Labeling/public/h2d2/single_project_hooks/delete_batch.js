function delete_project(){
    const project_id = document.getElementById("delete_section").getAttribute("data-project-id");
    
    fetch('/delete_batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            batch_id: project_id,
            project_id: CONF.project_id
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
            return console.log("Something bad happened!", data);
        }
        
        console.log('Project Deleted:', data);
        window.location.reload();
    })
    .catch(error => console.error('Error:', error));
}
