function start_annotating_clicked(){
    const ident = document.getElementById("identifier").value;
    if (ident.length < 3) return;

    fetch('/set_user_ident', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            project_id: CONF.project_id,
            batch_id: CONF.img_batch_id,
            ident
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        window.location.href = CONF.abs_path(`a/${ CONF.project_id }/${ CONF.img_batch_id }/start_editing`);
    })
    .catch(error => console.error('Error:', error)); 
}

