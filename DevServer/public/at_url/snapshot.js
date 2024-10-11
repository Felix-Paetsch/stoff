function activate_frame(n){
    // 0 is the first frame

    const container = document.getElementsByClassName("frame_container");
    if (n < 0){
        n = 0;
    } else if (n > container.length - 1){
        n = container.length - 1;
    }

    for (let i = 0; i < container.length; i++){
        container[i].style.display = "none";
    }

    container[n].style.display = "block";
    document.getElementById("current_frame_num").textContent = n + 1;
    frame_slider.value = n+1;
}

const frame_slider = document.getElementById("frame_slider");
frame_slider.value = 1;
document.getElementById("frame_slider").addEventListener("input", function(e){
    activate_frame(+frame_slider.value - 1);
});

document.addEventListener("keydown", function(e) {
    let current_frame = +frame_slider.value - 1; // Get the current frame (0-indexed)
    const max_frame = frame_slider.max - 1; // Max frame (0-indexed)
    const min_frame = frame_slider.min - 1; // Min frame (0-indexed, typically 0)

    if (e.key === "a") {
        // Move to the previous frame
        if (current_frame > min_frame) {
            activate_frame(current_frame - 1);
        }
    } else if (e.key === "d") {
        // Move to the next frame
        if (current_frame < max_frame) {
            activate_frame(current_frame + 1);
        }
    }
});