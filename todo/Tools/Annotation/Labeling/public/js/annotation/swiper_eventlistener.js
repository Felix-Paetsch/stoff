event_handler.subscribe("h2d2_loaded", (_) => {
    swiper_objects.swiper_stage.on('slideChange', active_image_slide_changed);

    // Add slide change event to framelist
    const fe = document.querySelectorAll("._hu_frame_element");
    for (let i = 0; i < fe.length; i++) {
        fe[i].addEventListener("click", () => {
            swiper_objects.swiper_stage.slideTo(i, 0)
        });
    }
});

function active_image_slide_changed(e){
    event_handler.emmit(
        new Action("activate_img", { 
            id: get_img_id_from_index(e.realIndex)
        })
    );
}