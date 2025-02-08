import assert from "../../StoffLib/assert.js";

export function cut_with_fixed_point(s, line, fixed_pt, grp1, grp2){
    assert(line.has_endpoint(fixed_pt), "Line doesn't have fixed point as endpoint");
    const non_fixed = line.other_endpoint(fixed_pt);
    const adjacent = non_fixed.get_adjacent_lines().filter(l => l !== line);

    if (grp1 == "smart"){
        assert(adjacent.length == 2, `Non-fixed point in a cut has ${ adjacent.length } other adjacent lines; expected 2`);
        grp1 = [adjacent[0]];
        grp2 = [adjacent[1]];
    } else if (grp2 == "smart"){
        grp2 = adjacent.filter(a => !grp1.includes(a));
    }

    const p1 = s.copy(non_fixed);
    //console.log(non_fixed.data, p1.data);
    p1.data.p = "p1";
    const p2 = s.copy(non_fixed);
    p2.data.p = "p2";

    const endpoints1 = [p1, fixed_pt];
    const endpoints2 = [p2, fixed_pt];

    let from_index = 0;
    let to_index = 1;
    if (line.p1 == fixed_pt){
        from_index = 1;
        to_index = 0;
    }

    const l1 = s.copy_line(line, endpoints1[from_index], endpoints1[to_index]);
    const l2 = s.copy_line(line, endpoints2[from_index], endpoints2[to_index]);

    for (const adjacent of grp1){
        adjacent.set_changed_endpoint(adjacent.other_endpoint(non_fixed), p1);
    }

    for (const adjacent of grp2){
        adjacent.set_changed_endpoint(adjacent.other_endpoint(non_fixed), p2);
    }

    s.remove(non_fixed);
    return {
        fixed_pt: fixed_pt,
        cut_parts: [
            {
                line: l1,
                point: p1,
                adjacent: grp1
            },{
                line: l2,
                point: p2,
                adjacent: grp2
            }
        ]
    }
}

export function cut_without_fixed_point(s, line, grp1, grp2){
    /* 
        If grp1, grp2 are *not* given, I assume that there are exactly 2 simple cycles with `line` in the midle like so:

            p1
          / | \
         <  |  >
          \ | /
            p2

        If only one is given I assume the other one is just the rest
    */

    if (grp1 instanceof Array && !(grp2 instanceof Array)){
        // Set grp1 to all things grp2 isn't 
        grp2 = [
            ...line.p1.get_adjacent_lines().filter(l => !grp1.includes(l) && l !== line),
            ...line.p2.get_adjacent_lines().filter(l => !grp1.includes(l) && l !== line)
        ]
    } else if (!(grp1 instanceof Array)){
        // Detect Lines which belong to a cycle
        // Later this could be advanced

        assert(line.p1.get_adjacent_lines().length == 3 && line.p2.get_adjacent_lines().length, "Can't automatically detect which lines group together");
        
        // Get first cycle
        grp1 = [line.p1.other_adjacent_lines(line)[0]];
        {
            const visited_points = [line.p1, line.p2];
            let current_line = grp1[0];
            let current_line_endpoint = current_line.other_endpoint(line.p1);
            while (visited_points.indexOf(current_line_endpoint) < 0) {
                visited_points.push(current_line_endpoint);
                current_line = current_line_endpoint.other_adjacent_line(current_line);
                current_line_endpoint = current_line.other_endpoint(current_line_endpoint);
            }
            assert(current_line_endpoint === line.p2, "Can't automatically detect which lines group together");
            grp1.push(current_line);
        }
        
        // Verify other line gets second cycle
        grp2 = [line.p1.other_adjacent_line(line, grp1[0])];
        {
            const visited_points = [line.p1, line.p2];
            let current_line = grp2[0];
            let current_line_endpoint = current_line.other_endpoint(line.p1);
            while (visited_points.indexOf(current_line_endpoint) < 0) {
                visited_points.push(current_line_endpoint);
                current_line = current_line_endpoint.other_adjacent_line(current_line);
                current_line_endpoint = current_line.other_endpoint(current_line_endpoint);
            }
            assert(current_line_endpoint === line.p2, "Can't automatically detect which lines group together");
            grp2.push(current_line);
        }
        assert(grp2[1] !== grp1[1], "Can't automatically detect which lines group together")
    }

    const fixed_1 = line.p1;
    let linep2 = line.p2;

    const {
        cut_parts: cut_parts_1
    } = cut_with_fixed_point(
        s, line, fixed_1, 
        grp1.filter(l => l.has_endpoint(linep2)),
        grp2.filter(l => l.has_endpoint(linep2))
    );

    const pre_connecting_line = cut_parts_1[0].line;
    const fixed_2 = pre_connecting_line.other_endpoint(fixed_1);
    linep2 = fixed_1;

    const {
        cut_parts: cut_parts_2
    } = cut_with_fixed_point(
        s, pre_connecting_line, fixed_2, 
        [...grp2.filter(l => l.has_endpoint(linep2)), cut_parts_1[1].line],
        grp1.filter(l => l.has_endpoint(linep2)),
    );

    const line1 = cut_parts_1[1].line;
    const line2 = cut_parts_2[1].line;
    s.remove(cut_parts_2[0].line);

    return {
        cut_parts: [
            {
                line: line2,
                adjacent: grp1
            },
            {
                line: line1,
                adjacent: grp2
            }
        ]
    }
}

export function cut_along_line_path(s, path, grp1, grp2){
    const endpoints = [];
    if (path.length == 1){
        endpoints.push(...path[0].get_endpoints);
    } else {
        let current_p = path[0].other_endpoint(path[1]);
        endpoints.push(current_p);

        for (let i = 0; i < path.length; i++){
            current_p = path[i].other_endpoint(current_p);
            endpoints.push(current_p);
        }
    }

    // If groups are not set
    if (typeof grp1 !== "array"){
        const old_grp1 = grp1;

        const lines = [];
        for (let i = 0; i < endpoints.length; i++){
            lines.concat(...endpoints[i].get_adjacent_lines().filter(l => path.indexOf(l) < 0));
        }
        grp1 = _get_connected_lines(lines[0], endpoints);
        
        const other_side_line = lines.filter(l => grp1.indexOf(l) < 0)[0];
        if (!other_side_line){
            if (old_grp1 == "force"){
                grp2 = [];
            } else {
                throw new Error("Can't automatically detect which lines group together");
            }
        } else {
            grp2 = _get_connected_lines(other_side_line, endpoints);
            if (lines.some(l => l.indexOf(grp1) < 0 && l.indexOf(grp2) < 0)){
                throw new Error("Can't automatically detect which lines group together");
            }
        }
    } else if (typeof grp2 !== "array"){
        grp2 = [];
        for (let i = 0; i < endpoints.length; i++){
            grp2.concat(...endpoints[i].get_adjacent_lines().filter(l => grp1.indexOf(l) < 0 && path.indexOf(l) < 0));
        }
    }

    if (grp1.some(l => grp2.indexOf(some) > -1)){
        throw new Error("Overlap in cutting groups.");
    }

    // grp1 and grp2 are set
    const cut_component_1 = {
        points: endpoints.map(p => [s.copy(p), p]),
        lines: []
    }
    _component_cut_along_line_path(s, cut_component_1, grp1);

    const cut_component_2 = {
        points: endpoints.map(p => [s.copy(p), p]),
        lines: []
    }
    _component_cut_along_line_path(s, cut_component_2, grp2);
    s.remove(...endpoints);

    return {
        cut_parts: [
            {
                lines: cut_component_1.lines,
                points: cut_component_1.points.map(p => p[0]),
                adjacent: grp1
            },{
                lines:  cut_component_2.lines,
                points: cut_component_2.points.map(p => p[0]),
                adjacent: grp2
            }
        ]
    }
}

function _component_cut_along_line_path(s, component, path, grp){
    for (let i = 0; i < path.length; i++){
        if (path[i].p1 == component.points[i][1]){
            component.lines.push(s.copy_line(path[i], component.points[i][0], component.points[i + 1][0]));
        } else {
            component.lines.push(s.copy_line(path[i], component.points[i+1][0], component.points[i][0]));
        }
    }

    for (let i = 0; i < grp.length; i++){
        for (let j = 0; j < component.points.length; j++){
            if (grp[i].p1 == component.points[j][1]){
                grp[i].set_endpoints(component.point[j][0], grp[i].p2);
                continue;
            } else if (grp[i].p2 == component.points[j][1]){
                grp[i].set_endpoints(grp[i].p1, component.point[j][0]);
                continue;
            }
        }

        throw new Error("Group line doesn't have an endpoint among the line_path.");
    }
}