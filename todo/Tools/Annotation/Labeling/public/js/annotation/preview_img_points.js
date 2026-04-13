function preview_copy_points(img_id){
    const copy_from = frame_toolbar.get_img_from_id(img_id);
    copy_from.render_points(); // Intialize stuff
    const active_img = get_active_img();

    const original_elements = active_img.canvas.querySelectorAll("._hu_point, .canvas_line");
    for (let i = 0; i < original_elements.length; i++){
        original_elements[i].classList.add("preview_hidden");
    }

    const new_points = copy_from.possible_keypoints.map(pt => {
        const new_pt = new ImgPoint(pt, active_img);
        
        new_pt.scale(1/active_img.current_img_modifier.zoom);
        new_pt.point_obj = pt.img_point.point_obj;
        new_pt.should_render = pt.img_point.position_in_img_set();
        new_pt.project_point = pt;
        return new_pt;
    });
    
    for (const pt of new_points){
        if (!pt.should_render) continue;
        const el = pt.render();
        if (el) el.classList.add("preview_visible");
    }

    const new_joints = copy_from.possible_joints.map(jt => {
        const points = copy_from.possible_keypoints.filter(p => {
            return jt.img_joint.img_points.map(d  => +d.project_point.id).includes(+p.id)
        });
        return {
            points,
            should_render: () => {
                return points[0].img_point.position_in_img_set() && points[1].img_point.position_in_img_set();
            }
        };
    });
    
    for (const jt of new_joints){
        if (!jt.should_render()) continue;

        const points = jt.points;
        let [x1, y1, x2, y2] = [
            points[0].img_point.point_obj.widthPercent, points[0].img_point.point_obj.heightPercent,
            points[1].img_point.point_obj.widthPercent, points[1].img_point.point_obj.heightPercent
        ];

        const el = document.createElement('div');
        active_img.canvas.appendChild(el);

        // Set line styles
        el.style.position = 'absolute';
        el.style.height = length + 'px';

        el.style.left = `calc(${ Math.min(x1, x2) }% - 0px)`;
        el.style.top = `calc(${  Math.min(y1, y2) }% - 0px)`;
        el.style.width = `calc(${   Math.abs(x1 - x2) }% - 0px)`;
        el.style.height = `calc(${  Math.abs(y1 - y2) }% - 0px)`;

        
        const line = document.createElement('div');
        el.appendChild(line);
        el.classList.add("canvas_line")
        line.style.background = "black";
        line.style.height = `calc(.1rem * ${ 1/active_img.current_img_modifier.zoom })`;
        line.style.borderRadius = "5rem";

        const rect = el.getBoundingClientRect();
        const diagonal = Math.sqrt(rect.width ** 2 + rect.height ** 2) * 1/active_img.current_img_modifier.zoom;
        const angle = Math.atan2(rect.height, rect.width) * (180 / Math.PI);

        line.style.position = 'absolute';
        line.style.width = `${diagonal}px`;
        line.style.top = `calc(0.05rem * ${ 1/active_img.current_img_modifier.zoom })`;
        line.style.left = '0';
        line.style.transformOrigin = '0 0';
        line.style.transform = `rotate(${angle}deg)`;

        if ((x1 - x2)*(y1 - y2) < 0){
            el.style.transform = "scaleX(-1)"
        }

        el.style.zIndex = '5';
        el.style.pointerEvents = 'none';

        if (!active_img.canvas){ throw new Error("joint canvas is not defined!"); }
        active_img.canvas.appendChild(el);
        
        el.classList.add("preview_visible");
    }
}

function view_current_points(){
    const hidden = document.querySelectorAll(".preview_hidden");
    for (let i = 0; i < hidden.length; i++){
        hidden[i].classList.remove("preview_hidden");
    }

    const visible = document.querySelectorAll(".preview_visible");
    visible.forEach(element => {
        element.remove();
    });
}


document.addEventListener("DOMContentLoaded", guard_editing(() => {
    const frame_elements = document.querySelectorAll("._hu_frame_element");
    for (let i = 0; i < frame_elements.length; i++){
        const hover_el = frame_elements[i].querySelector(".copy_tooltip");
        hover_el.addEventListener("mouseenter", () => {
            preview_copy_points(hover_el.attributes.getNamedItem("_id").value);
        });
        hover_el.addEventListener("mouseleave", () => {
            view_current_points()
        });
        document.addEventListener("mousemove", (e) => {
            if (e.target.id !== "Your_Icons" && !e.target.ownerSVGElement && e.target.id !== "Your_Icons"){
                view_current_points();
            }
        });
    }
}));