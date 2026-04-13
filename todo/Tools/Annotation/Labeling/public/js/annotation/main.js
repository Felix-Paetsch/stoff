event_handler.after_dom_loaded(() => {
    event_handler.emmit(
        new Action("activate_img", { id: get_img_id_from_index(0) })
    );
});

