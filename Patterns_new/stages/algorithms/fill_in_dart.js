import { rotation_fun, vec_angle_clockwise } from "../../../StoffLib/geometry.js";

export default function fill_in_dart(sketch, dart_number, reverse){
    /*
        // Docs, bla...
        // we expect darts to be of type "dart" and to have a dart_number associated to them

        #madeByFelix
    */

    /* vvvvvvvvvvvvvvvvvvvv
      You probably want to select these lines differently, as it is still dependent on orientation!
    vvvvvvvvvvvvvvvvvvvv */

    let dart_lines = sketch.lines_by_key("dart_number")[dart_number];

    let outer_line;
    let inner_line;
    if (reverse) {
        outer_line = dart_lines.filter(l => l.p2.data.p == "p1")[0];
        inner_line = dart_lines.filter(l => l.p2.data.p == "p2")[0];
    } else {
        outer_line = dart_lines.filter(l => l.p2.data.p == "p2")[0];
        inner_line = dart_lines.filter(l => l.p2.data.p == "p1")[0];
    }

    /* ^^^^^^^^^^^^^^^^^^^^^^^^^ */

    // We fold towards "outer_line"

  //  sketch.dev.start_recording("/hot");
    const common = inner_line.common_endpoint(outer_line);
    const outer_line_other = outer_line.other_endpoint(common);
    const inner_line_other = inner_line.other_endpoint(common);

    const extension_sample_points = collect_sample_points(outer_line, outer_line_other)

    // Create Half Line
    const dart_full_angle = vec_angle_clockwise(
        outer_line_other,
        inner_line_other,
        common
    );
    const half_line_at_angle = sketch.line_at_angle(common, dart_full_angle / 2, 100, outer_line_other);

    const most_outer_position = extension_sample_points[extension_sample_points.length - 1];
    const most_outer_pt_mirrored = sketch.add(most_outer_position.mirror_at(outer_line.get_endpoints()));
    const full_line_to_mirror = sketch._line_between_points_from_sample_points(outer_line_other, most_outer_pt_mirrored, extension_sample_points).mirror();

//    sketch.dev.snapshot();

    // Cut the line at the right position
    const intersections = sketch.intersect_lines(full_line_to_mirror, half_line_at_angle.line);
    const target_line = intersections.l1_segments[0];

    sketch.remove(
        intersections.l1_segments[1],
        ...intersections.l2_segments,
        most_outer_pt_mirrored,
        half_line_at_angle.other_endpoint
    );

    const fill_in_center_pt = target_line.other_endpoint(outer_line_other);

    // Copy the line over
    const target_line_mirror = sketch.copy_line(
        target_line,
        inner_line.other_endpoint(common),
        fill_in_center_pt,
    ).mirror();

    const merged = sketch.merge_lines(target_line, target_line_mirror);
    sketch.remove(fill_in_center_pt);
    merged.data.type = "fill in";
    merged.data.dart_number = dart_number;
    // merges has on the side of merge.p1 the "outer" side and on merge.p2 the "inner" site
    return merged;
}

function collect_sample_points(outer_line, outer_endpoint) {
    let center_start_point = outer_line.other_endpoint(outer_endpoint);
    
    let last_line_endpoint = outer_endpoint;
    let potential_next_line = outer_endpoint.other_adjacent_lines(outer_line);
    let transformation_fun = (vec) => vec;

    const sample_points = [last_line_endpoint];
    
    while (potential_next_line.length == 1){
        const next_line = potential_next_line[0];
        if (next_line.has_endpoint(center_start_point)) break;

        if (next_line.data.type != "dart"){
            const new_sample_points = next_line.get_absolute_sample_points();
            if (next_line.p2 == last_line_endpoint){
                new_sample_points.reverse();
            }

            new_sample_points.shift();
            new_sample_points.forEach(p => sample_points.push(transformation_fun(p)));

            last_line_endpoint  = next_line.other_endpoint(last_line_endpoint);
            potential_next_line = last_line_endpoint.other_adjacent_lines(next_line);
            continue;
        }

        const first_dart_line = next_line;
        const center_point = next_line.other_endpoint(last_line_endpoint);
        const second_dart_line = center_point.other_adjacent_lines(first_dart_line)
                                             .lines_by_key("dart_number")[first_dart_line.data.dart_number][0];
        
        const rotate = rotation_fun(center_point, [
            second_dart_line.other_endpoint(center_point),
            first_dart_line.other_endpoint(center_point)
        ]);

        let temp_transform_fun = transformation_fun;
        transformation_fun = (vec) => {
            return temp_transform_fun(rotate(vec))
        };

        last_line_endpoint = second_dart_line.other_endpoint(center_point);
        potential_next_line = last_line_endpoint.other_adjacent_lines(second_dart_line);
    } 
    
    return sample_points;
}