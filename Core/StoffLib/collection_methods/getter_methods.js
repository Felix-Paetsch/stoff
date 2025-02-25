import Point from "../point.js";
import Line from "../line.js";

export default (Class, set_if_not_exists) => {
    // Not typed
    set_if_not_exists(Class, "unique", function () {
        const se = this.get_sketch_elements();
        const filtered = se.filter((value, index) => se.indexOf(value) === index);
        return this.make_sketch_element_collection(filtered);
    });

    set_if_not_exists(Class, "group_by_key", function(key){
        const pts = this.points_by_key(key);
        const lns = this.lines_by_key(key);
        const res = this.make_sketch_element_collection(pts.concat(lns));
        res.points = pts;
        res.lines  = lns;
        return res;
    });

    set_if_not_exists(Class, "lines_by_key", function(key){
        return this.get_lines().reduce((acc, line) => {
            const groupKey = line.data[key] !== undefined ? line.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = this.new_sketch_element_collection();
            }
            acc[groupKey].push(line);
            return acc;
        }, {});
    });

    set_if_not_exists(Class, "points_by_key", function(key){
        return this.get_points().reduce((acc, pt) => {
            const groupKey = pt.data[key] !== undefined ? pt.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = this.new_sketch_element_collection();
            }
            acc[groupKey].push(pt);
            return acc;
        }, {});
    });

    // Strictly typed
    set_if_not_exists(Class, "get_typed_line", function(type){
        return (this.get_typed_lines(type) || [null])[0];
    });

    set_if_not_exists(Class, "get_typed_point", function(type){
        return (this.get_typed_points(type) || [null])[0];
    });

    set_if_not_exists(Class, "get_untyped_lines", function(){
        return this.get_typed_lines("_");
    });

    set_if_not_exists(Class, "get_untyped_points", function(){
        return this.get_typed_points("_");
    });

    set_if_not_exists(Class, "get_typed_lines", function(type){
        return this.lines_by_key("type")[type] || [];
    });

    set_if_not_exists(Class, "get_typed_points", function(type){
        return this.points_by_key("type")[type] || [];
    });

    // Weakly typed
    set_if_not_exists(Class, "get_point_between_lines", function(check1, check2){
        return this.get_points_between_lines(check1, check2)[0] || null;
    });

    set_if_not_exists(Class, "get_points_between_lines", function(check1, check2){
        const this_points = this.get_points();

        if (typeof check1 == "string"){
            const type = check1;
            check1 = (ln) => ln.data.type === type || (type == "_" && typeof ln.data.type == "undefined")
        } else if (check1 instanceof Line){
            const checkln = check1;
            check1 = (ln) => ln == checkln;
        } else if (check1 === null){
            check1 = (_) => true;
        }

        if (typeof check2 == "string"){
            const type = check2;
            check2 = (ln) => ln.data.type === type || (type == "_" && typeof ln.data.type == "undefined")
        } else if (check2 instanceof Line){
            const checkln = check2;
            check2 = (ln) => ln == checkln;
        } else if (check2 === null){
            check2 = (_) => true;
        }

        const points = this.new_sketch_element_collection();
        const lines = this.get_sketch().lines;
        const checks = lines.map(l => [check1(l), check2(l)]);

        for (let i = 0; i < lines.length - 1; i++){
            if (!checks[i][0] && !checks[i][1]){
                continue;
            }
            for (let j = i + 1; j < lines.length; j++){
                const common_endpoint = lines[i].common_endpoint(lines[j]);
                if (
                    common_endpoint &&
                    this_points.includes(common_endpoint) &&
                    (
                        (checks[j][0] && checks[i][1])
                        || (checks[j][1] && checks[i][0])
                    )
                ){
                    points.push(common_endpoint);
                }
            }
        }

        return points;
    })

    set_if_not_exists(Class, "get_line_between_points", function(check1, check2){
        return this.get_lines_between_points(check1, check2)[0] || null;
    })

    set_if_not_exists(Class, "get_lines_between_points", function(check1, check2){
        const this_lines = this.get_lines();
        
        if (typeof check1 == "string"){
            const type = check1;
            check1 = (pt) => pt.data.type === type || (type == "_" && typeof pt.data.type == "undefined")
        } else if (check1 instanceof Point){
            const checkpt = check1;
            check1 = (pt) => pt == checkpt;
        } else if (check1 === null){
            check1 = (_) => true;
        }

        if (typeof check2 == "string"){
            const type = check2;
            check2 = (pt) => pt.data.type === type || (type == "_" && typeof pt.data.type == "undefined")
        } else if (check2 instanceof Point){
            const checkpt = check2;
            check2 = (pt) => pt == checkpt;
        } else if (check2 === null){
            check2 = (_) => true;
        }

        const lines = this.new_sketch_element_collection();
        const points = this.get_sketch().points;
        const checks = points.map(p => [check1(p), check2(p)]);

        for (let i = 0; i < points.length - 1; i++){
            if (!checks[i][0] && !checks[i][1]){
                continue;
            }
            for (let j = i + 1; j < points.length; j++){
                if (
                    (checks[j][0] && checks[i][1])
                    || (checks[j][1] && checks[i][0])
                ){
                    lines.push(
                        ...points[i].get_adjacent_lines().filter(
                            l => this_lines.includes(l) && l.get_endpoints().includes(points[j])
                        )
                    );
                }
            }
        }

        return lines;
    });

    set_if_not_exists(Class, "get_adjacent_line", function(pt, check = null){
        return this.get_adjacent_lines(pt, check)[0] || null;
    });

    set_if_not_exists(Class, "get_adjacent_lines", function(pt, check = null){
        const this_lines = this.get_lines();

        if (typeof check == "string"){
            const type = check;
            check = (ln) => ln.data.type === type || (type == "_" && typeof ln.data.type == "undefined")
        } else if (check == null || check == true){
            check = (_ln) => true;
        } else if (check instanceof Point){
            const tcheck = check;
            check = (ln) => ln.has_endpoint(tcheck);
        }

        return this.make_sketch_element_collection(
            pt.get_adjacent_lines().filter(l => this_lines.includes(l) && check(l))
        );
    });

    set_if_not_exists(Class, "lines_by_key", function(key){
        return this.get_lines().reduce((acc, line) => {
            const groupKey = line.data[key] !== undefined ? line.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = this.new_sketch_element_collection();
            }
            acc[groupKey].push(line);
            return acc;
        }, {});
    });

    set_if_not_exists(Class, "points_by_key", function(key){
        return this.get_points().reduce((acc, pt) => {
            const groupKey = pt.data[key] !== undefined ? pt.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = this.new_sketch_element_collection();
            }
            acc[groupKey].push(pt);
            return acc;
        }, {});
    });
}