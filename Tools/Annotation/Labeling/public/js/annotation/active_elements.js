let active_img = null;

event_handler.subscribe("activate_img", (action) => {
    // Assumes current slide is the active image, the rest of dom manipulation will be done here
    const img_id = action.get_data().id;
    active_img = images.filter(img => img.get_id() == img_id)[0];
    active_img.activate();
    setImgContainerWidth();
});

function get_active_img(){
    return active_img;
}