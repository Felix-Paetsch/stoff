setTimeout(() => {
    const img = document.querySelector("#image_inner_wrapper img");
    if (img){
        document.getElementById("image_inner_wrapper").style.width = `min(${ img.width }px, 60rem)`;
        document.getElementById("image_inner_wrapper").style.height = `min(${ img.height }px, calc(60rem * ${ img.height / img.width }))`;
    }
}, 50)

function upload_new_example_image(e){
    const form = document.getElementById('img_upload_wrapper');
    
    e.preventDefault(); // prevent the form from navigating to the specified URL
    const formData = new FormData(form);

    fetch(`/requests/upload_example_image/${ frontend_vars.project_id }`, {
        method: 'POST',
        body: formData
    })
    .then(async response => {
        if (response.ok){
            const href = await response.text();
            console.log(href);
            setTimeout(() => {
                document.getElementById("image_inner_wrapper").innerHTML = `
                    <img src="${ href }" onclick="img_click_event(event)" alt="">
                `;

                setTimeout(() => {
                    const img = document.querySelector("#image_inner_wrapper img");
                    document.getElementById("image_inner_wrapper").style.width = `min(${ img.naturalWidth }px, 60rem)`;
                    document.getElementById("image_inner_wrapper").style.height = `calc(min(${ img.naturalWidth }px, 60rem) * ${ img.naturalHeight } / ${ img.naturalWidth })`;
                }, 50)
            }, 100);
            
        }
        else throw new Error("Response not ok")
    })
    .catch(error => {
        console.error('Error uploading file:', error);
    });
}