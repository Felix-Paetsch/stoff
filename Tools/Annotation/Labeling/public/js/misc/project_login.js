const input = document.getElementById('identifier');
input.focus();

if (input.value.length > 2){
    document.getElementsByClassName("btn-start-annotating")[0].classList.remove("disable");
}

input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        start_annotating_clicked();
    }
});
