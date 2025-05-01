function save_new_project(){
    const project_name = document.getElementById("new_project_text_input").value;
    
    fetch('/create_project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_name })
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
        
        console.log('Project Created:', data);
        document.getElementById("new_project_text_input").value = ""; // So it defaults to that later
        window.location.reload();
    })
    .catch(error => console.error('Error:', error));
}
