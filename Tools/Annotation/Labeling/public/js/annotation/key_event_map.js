event_handler.add_keydown("+", (e) => {
    get_active_img().scale_up(e);
});

event_handler.add_keydown("-", (e) => {
    get_active_img().scale_down(e);
});

event_handler.subscribe("wheel", ({ data }) => {
    if (some_parent_has_class(data.target, "_hu_point_container")){
        data.event.preventDefault();

        if (data.deltaY < 0){
            get_active_img().scale_up();
        } else if (data.deltaY > 0){
            get_active_img().scale_down();
        }
    }
}, {
    only_on_top: true
});

event_handler.add_keydown("y", (e) => {
    get_active_img().undo_redo.undo();
});

event_handler.add_keydown("x", (e) => {
    get_active_img().undo_redo.redo();
});

event_handler.add_keydown("m", (e) => {
    get_active_img().img_move_pressed(e);
});

event_handler.add_keyup("m", (e) => {
    get_active_img().img_move_pressed(e);
});

event_handler.add_keydown("r", (e) => {
    get_active_img().reset(e);
});

event_handler.add_keydown("a", (e) => {
    get_active_img().set_interaction_mode("annotate");
});

event_handler.add_keydown("e", (e) => {
    get_active_img().set_interaction_mode("annotate", "move_next");
});

event_handler.add_keyup("d", (e) => {
    get_active_img().set_interaction_mode("drag");
});

event_handler.add_keydown("d", (e) => {
    get_active_img().img_move_pressed(e);
});

event_handler.add_keydown("k", (e) => {
    const img = get_active_img();
    img.remove_point(keypoint_toolbar.get_active_point().id);
});

event_handler.add_keyup("d", (e) => {
    get_active_img().img_move_pressed(e);
});

event_handler.add_keydown("ArrowRight", (e) => {
    e.data.event.preventDefault();
    e.data.event.stopPropagation();

    get_active_img().nudge_current_point("right");
});

event_handler.add_keydown("ArrowUp", (e) => {
    e.data.event.preventDefault();
    e.data.event.stopPropagation();

    get_active_img().nudge_current_point("up");
});

event_handler.add_keydown("ArrowLeft", (e) => {
    e.data.event.preventDefault();
    e.data.event.stopPropagation();

    get_active_img().nudge_current_point("left");
});

event_handler.add_keydown("ArrowDown", (e) => {
    e.data.event.preventDefault();
    e.data.event.stopPropagation();

    get_active_img().nudge_current_point("down");
});


event_handler.add_keydown("z", (e) => {
    get_active_img().copy_zoom(frame_toolbar.get_prev_img(), true);
});

event_handler.add_keydown("u", (e) => {
    get_active_img().set_zoom({
        "zoom": 1,
        "x_offset": 0,
        "y_offset": 0
    });
});

event_handler.add_keydown("o", (e) => {
    get_active_img().toggle_hide_keypoints();
})

// Toggle mouse btns display
event_handler.add_keydown("b", (e) => {
    document.getElementById("hu_editing_functions_toolbar").classList.toggle("hidden");
});

// Keypoint Toolbar

event_handler.add_keydown("n", ((action) => {
    keypoint_toolbar.activate_next_point();
}), { only_on_top: true });

event_handler.add_keydown("p", ((action) => {
    keypoint_toolbar.activate_prev_point();
}), { only_on_top: true });

event_handler.add_keydown("t", ((action) => {
    keypoint_toolbar.activate_next_non_annotated();
}), { only_on_top: true });

event_handler.add_keydown("h", ((action) => {
    keypoint_toolbar.toggle_hide_point(keypoint_toolbar.active_point.id);
}), { only_on_top: true });

event_handler.add_keydown("g", ((action) => {
    // Hide prev point
    if (typeof keypoint_toolbar.active_point == "undefined"){
        keypoint_toolbar.set_first_point_active()
    } else {
        const current_index = keypoint_toolbar.point_data.indexOf(keypoint_toolbar.active_point);
        if (current_index == 0) return;

        keypoint_toolbar.toggle_hide_point(keypoint_toolbar.point_data[current_index - 1].id);
    }
}), { only_on_top: true });

event_handler.add_keydown("s", ((action) => {
    event_handler.emmit(
        new Action("skip_point", { 
            id: keypoint_toolbar.active_point.id
        })
    );
}), { only_on_top: true });

for (let i = 1; i < Math.min(10, keypoint_toolbar.point_data.length + 1); i++){
    event_handler.add_keydown(String(i), ((action) => {
        keypoint_toolbar.set_active_point(i - 1);
    }), { only_on_top: true });
}

// Frame toolbar

event_handler.add_keydown("w", ((action) => {
    frame_toolbar.activate_next_img();
}), { only_on_top: true });

event_handler.add_keydown("q", ((action) => {
    frame_toolbar.activate_prev_img();
}), { only_on_top: true });

event_handler.add_keydown("f", ((action) => {
    frame_toolbar.skip_img(frame_toolbar.get_active_img().id, action.data.event);
}), { only_on_top: true });

event_handler.add_keydown("c", ((action) => {
    const images = iter_images();

    const current_index = images.indexOf(frame_toolbar.active_img);
    if (current_index == 0) {
        return;
    }
    
    frame_toolbar.copy_from_img(get_img_id_from_index(current_index - 1));
}), { only_on_top: true });