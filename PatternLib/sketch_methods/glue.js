import assert from "../../StoffLib/assert.js";
import { affine_transform_from_input_output } from "../../StoffLib/geometry.js";
import { default_data_callback } from "../../StoffLib/copy.js";
import { EPS } from "../../StoffLib/geometry.js";

export function glue_with_fixed_point(s, ep1, ep2, data){
    console.log(data);

    assert(ep1[0] == ep2[0], "First glue point isn't equal");
    const fixed = ep1[0];
    const p1 = ep1[1];
    const p2 = ep2[1];
    
    // Check that restricted components only have that single point in common
    const rcp1 = restricted_component_pts(p1, fixed);
    const rcp2 = restricted_component_pts(p2, fixed);

    // Check they dont have a pt in common (or they lie on top), then move && glue...
    if (p1.equals(p2, EPS.TINY)){
        for (let i = 0; i < rcp1.length; i++){
            if (rcp2.includes(rcp1[i])) throw new Error("Can't glue linked parts");
        }
    }
    
    const transform_fun = affine_transform_from_input_output(ep2, ep1);
    rcp2.forEach(pt => pt.move_to(transform_fun(pt)));

    const cb = typeof data.points == "string" ? default_data_callback : data.points;
    const merged_pt = s.merge_points(p1, p2, cb);

    if (data.anchors == "delete"){
        s.get_lines().forEach(l => l.data.__anchor && l.remove());
    }

    const glue_lines = s.lines_by_key("__glue_line")[true] || merged_pt.common_lines(fixed);
    s.remove_underscore_attributes("__glue_line");

    if (data.lines == "keep"){
        return {
            glue_type: "with_fixed",
            point: merged_pt,
            fixed_point: fixed,

            glue_lines: glue_lines,

            remove_points: false,
            line_handling: "keep"
        }
    }
    
    if (data.lines == "delete" || data.points.startsWith("delete")){
        s.remove_lines(...glue_lines);
    } else if (!data.points.startsWith("delete")){ // Merge Case
        assert(glue_lines.length == 1 || glue_lines.length == 2, "Can't glue lines (wront amount)");
        const r = s.copy_line(glue_lines[0]);
        r.data = data.lines(...glue_lines.map(l => l.data), ...glue_lines); // data.lines is data_callback
        s.remove(...glue_lines);
    }

    const merged = [];
    if (data.points == "delete_both"){
        merged.push(delete_glue_point(s, fixed, data.lines));
    }
    if (typeof data.points == "string" && data.points.startsWith("delete")){
        merged.unshift(delete_glue_point(s, merged_pt, data.lines));
        return {
            glue_type: "with_fixed",
            fixed_point: fixed.sketch ? fixed : null,
            merged_lines: merged,
            
            remove_points: true,
            line_handling: "delete"
        }
    }

    if (data.lines == "delete"){
        return {
            glue_type: "with_fixed",
            point: merged_pt,
            fixed_point: fixed,
            
            remove_points: false,
            line_handling: "delete"
        }
    } 

    const glue_line = merged_pt.common_line(fixed);
    
    return {
        glue_type: "with_fixed",
        point: merged_pt,
        fixed_point: fixed,

        glue_line,
        glue_lines: glue_line ? [glue_line] : [],

        remove_points: false,
        line_handling: "merge"
    }
}

export function glue(s, ep1, ep2, data){
    assert(
        !ep1[0].connected_component().equals(ep2[0].connected_component())
        && ep1[0].connected_component().equals(ep1[1].connected_component())
        && ep2[0].connected_component().equals(ep2[1].connected_component()),
        "Glueing points dont belong to two distinct connected components."
    );
    
    const transform_fun = affine_transform_from_input_output(ep2, ep1);
    ep2[0].connected_component().transform(pt => pt.move_to(transform_fun(pt)));

    const cb = typeof data.points == "string" ? default_data_callback : data.points;
    const merged_pts = [
        s.merge_points(ep1[0], ep2[0], cb),
        s.merge_points(ep1[1], ep2[1], cb)
    ];

    if (data.anchors == "delete"){
        s.get_lines().forEach(l => l.data.__anchor && l.remove());
    }

    const glue_lines = s.lines_by_key("__glue_line")[true] || merged_pts[0].common_lines(merged_pts[1]);
    s.remove_underscore_attributes("__glue_line");

    if (data.lines == "keep"){
        return {
            glue_type: "without_fixed",
            points: merged_pts,

            glue_lines: glue_lines,

            remove_points: false,
            line_handling: "keep"
        }
    }
    
    if (data.lines == "delete" || (typeof data.points == "string" && data.points.startsWith("delete"))){
        s.remove_lines(...glue_lines);
    } else if (!(typeof data.points == "string" && data.points.startsWith("delete"))){ // Merge Case
        assert(glue_lines.length == 1 || glue_lines.length == 2, "Can't glue lines (wront amount)");
        const r = s.copy_line(glue_lines[0]);
        r.data = data.lines(...glue_lines.map(l => l.data), ...glue_lines); // data.lines is data_callback
        s.remove(glue_lines);
    }

    if (typeof data.points == "string" && data.points.startsWith("delete")){
        const merged = [
            delete_glue_point(s, merged_pts[0], data.lines),
            delete_glue_point(s, merged_pts[1], data.lines)
        ];

        return {
            glue_type: "without_fixed",
            merged_lines: merged,
            
            remove_points: true,
            line_handling: "delete"
        }
    }

    if (data.lines == "delete"){
        return {
            glue_type: "with_fixed",
            points: merged_pts,
            
            remove_points: false,
            line_handling: "delete"
        }
    } 

    const glue_line = merged_pts[0].common_line(merged_pts[0]);
    
    return {
        glue_type: "with_fixed",
        points: merged_pts,

        glue_line,
        glue_lines: glue_line ? [glue_line] : [],

        remove_points: false,
        line_handling: "merge"
    }
}

function delete_glue_point(s, pt, line_callback){
    const adjacent = pt.get_adjacent_lines();
    if (adjacent.length < 2){
        s.remove(pt);
        return null;
    }
    if (adjacent.length > 2) throw new Error("Cant safely delete glue point! To many adjacent lines");
    return s.merge_lines(...adjacent, true, line_callback);
}

function restricted_component_pts(p1, fixed){
    // Returns the lines in the restricted component of p1 that don't meet p2
    // There can be at most one line between p1 and p2! it will be ignored

    const visited_points = [fixed];
    const to_visit_points = [p1];

    while (to_visit_points.length > 0){
        const current_pt = to_visit_points.pop();
        visited_points.push(current_pt);

        const lines = current_pt.get_adjacent_lines();
        for (const l of lines){
            const other_endpoint = l.other_endpoint(current_pt);
            if (visited_points.indexOf(other_endpoint) < 0 && to_visit_points.indexOf(other_endpoint) < 0){
                to_visit_points.push(other_endpoint);
            }
        }
    }

    visited_points.unshift();
    return visited_points;
}