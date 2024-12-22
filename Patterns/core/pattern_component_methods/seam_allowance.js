export default function add_seam_allowance(s, cc, type_amt_map){
    const component = s.oriented_component(cc);
    const allowance_by_type = {}
    for (let key of Object.keys(type_amt_map)){
        for (let type of type_amt_map[key]){
            allowance_by_type[type] = key;
        }
    }

    const allowances = []
    component.lines.forEach((ln, i) => {
        if (allowance_by_type[ln.data.type]){
            const offset = s.line_with_offset(ln, allowance_by_type[ln.data.type], !component.orientations[i]).line;
            offset.data.type = "seam_allowance__" + ln.data.type;
            allowances.push(offset);
        } else {
            allowances.push(null);
            throw new Error("Not specified what should happen.");
            // Most likely we just go own to the allowance point, maybe smoothly
        }
    });

    for (let i = 0; i < allowances.length; i++){
        const j = (i+1) % allowances.length;

        const tangent_point1 = component.orientations[i] ? 
            allowances[i].p2 : allowances[i].p1;
        const tangent_point2 = component.orientations[j] ? 
            allowances[j].p1 : allowances[j].p2;
        
        const tangent_line_1 = allowances[i].get_tangent_line(tangent_point1);
        const tangent_line_2 = allowances[j].get_tangent_line(tangent_point2);
        const IP = s.point(tangent_line_1.intersect(tangent_line_2));

        const extension1 = s.line_between_points(IP, tangent_point1);
        allowances[i] = s.merge_lines(allowances[i], extension1, true); // We keep orientation of allowances[i]
        const extension2 = s.line_between_points(IP, tangent_point2);
        allowances[j] = s.merge_lines(allowances[j], extension2, true); // We keep orientation of allowances[i]
    }
    
    return s;
}