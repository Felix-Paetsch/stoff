import Point from "../../StoffLib/point.js";
import Line from "../../StoffLib/line.js";

export default (Sketch) => {
    // Strictly typed
    Sketch.prototype.get_typed_line = function(type){
        return (this.lines_by_key("type")[type] || [null])[0];
    }

    Sketch.prototype.get_typed_lines = function(type){
        return this._set_typed_line_point_array_methods(this.lines_by_key("type")[type] || []);
    }

    Sketch.prototype.get_untyped_lines = function(){
        return this.get_typed_lines("_");
    }

    Sketch.prototype.get_untyped_points = function(){
        return this.get_typed_points("_");
    }

    Sketch.prototype.get_typed_point = function(type){
        return (this.points_by_key("type")[type] || [null])[0];
    }

    Sketch.prototype.get_typed_points = function(type){
        return this._set_typed_line_point_array_methods(this.points_by_key("type")[type] || []);
    }

    // Weakly typed
    Sketch.prototype.get_point_between_lines = function(check1, check2){
        return this.get_points_between_lines(check1, check2)[0] || null;
    }

    Sketch.prototype.get_points_between_lines = function(check1, check2){
        if (typeof check1 == "string"){
            const type = check1;
            check1 = (ln) => ln.data.type === type 
        } else if (check1 instanceof Line){
            const checkln = check1;
            check1 = (ln) => ln == checkln;
        } else if (check1 === null){
            check1 = (_) => true;
        }

        if (typeof check2 == "string"){
            const type = check2;
            check2 = (ln) => ln.data.type === type 
        } else if (check2 instanceof Line){
            const checkln = check2;
            check2 = (ln) => ln == checkln;
        } else if (check2 === null){
            check2 = (_) => true;
        }

        const points = [];
        const lines = this.get_typed_lines();
        const checks = lines.map(l => [check1(l), check2(l)]);

        for (let i = 0; i < lines.length - 1; i++){
            if (!checks[i][0] && !checks[i][1]){
                continue;
            }
            for (let j = i + 1; j < lines.length; j++){
                const common_endpoint = lines[i].common_endpoint(lines[j]);
                if (
                    common_endpoint &&
                    (
                        (checks[j][0] && checks[i][1])
                        || (checks[j][1] && checks[i][0])
                    )
                ){
                    points.push(common_endpoint);
                }
            }
        }

        return this._set_typed_line_point_array_methods(points);
    }

    Sketch.prototype.get_line_between_points = function(check1, check2){
        return this.get_lines_between_points(check1, check2)[0] || null;
    }

    Sketch.prototype.get_lines_between_points = function(check1, check2){
        if (typeof check1 == "string"){
            const type = check1;
            check1 = (ln) => ln.data.type === type 
        } else if (check1 instanceof Point){
            const checkpt = check1;
            check1 = (pt) => pt == checkpt;
        } else if (check1 === null){
            check1 = (_) => true;
        }

        if (typeof check2 == "string"){
            const type = check2;
            check2 = (ln) => ln.data.type === type 
        } else if (check2 instanceof Point){
            const checkpt = check2;
            check2 = (pt) => pt == checkpt;
        } else if (check2 === null){
            check2 = (_) => true;
        }

        const lines = [];
        const points = this.get_typed_points();
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
                            l => l.get_endpoints().includes(points[j])
                        )
                    );
                }
            }
        }

        return this._set_typed_line_point_array_methods(lines);
    }

    Sketch.prototype.get_adjacent_line = function(pt, check){
        return this.get_adjacent_lines(pt, check)[0] || null;
    }

    Sketch.prototype.get_adjacent_lines = function(pt, check = null){
        if (typeof check == "string"){
            const type = check;
            check = (ln) => ln.data.type === type 
        } else if (check == null || check == true){
            check = (_ln) => true;
        } else if (check instanceof Point){
            const tcheck = check;
            check = (ln) => ln.has_endpoint(tcheck);
        }

        return this._set_typed_line_point_array_methods(
            pt.get_adjacent_lines().filter(l => check(l))
        );
    }

    Sketch.prototype._set_typed_line_point_array_methods = function(arr){
        // Anything more suffisticated should be done directly on the array.
        arr.set_type = (t) => {
            arr.forEach(x => x.data.type = t);
            return arr;
        };
        arr.set_data = (data) => {
            arr.forEach(x => {
                if (typeof data == "function") {
                    const r = data(x);
                    if (r) x.data = r;
                } else {
                    x.data = dublicate_data(data);
                }
            });
            return arr;
        };
        return arr;
    }
}
