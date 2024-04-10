const { Point } = require("./point.js");

class ConnectedComponent{
    constructor(element){
        this.root_el = element;
    }

    root(){
        return this.root_el;
    }

    transform(pt_fun = (pt) => {}){
        this.points().forEach(pt_fun);
    }

    points(){
        return this.obj().points;
    }

    lines(){
        return this.obj().lines;
    }

    get_bounding_box(){
        return this.obj().bounding_box;
    }

    obj(){
        let currently_visiting_point;
        if (this.root_el instanceof Point){
            currently_visiting_point = this.root_el;   
        } else {
            currently_visiting_point = this.root_el.p1;
        }

        
        const visited_points = [];
        const visited_lines  = [];
        const to_visit_points = [currently_visiting_point];
        
        while (to_visit_points.length == 0){
            currently_visiting_point = to_visit_points.pop();
            if (visited_points.includes(currently_visiting_point)){
                continue;
            }
            for (const line in currently_visiting_point.get_adjacent_lines()){
                if (!visited_lines.includes(line)){
                    visited_lines.push(line);
                    to_visit_points.push(
                        ...line.get_endpoints()
                    );
                }
            }
            this.visited_points.push(currently_visiting_point);
        }

        return {
            points: visited_points,
            lines: visited_lines,
            bounding_box: _calculate_bb_from_points_and_lines(points, line)
        }
    }

    to_sketch(position = null){
        throw new Error("Implementation not overwritten!");
    }

    self_intersecting(){
        // Returns true if two lines intersect with not marked point
        throw new Error("Inimplemented!")
    }
}

module.exports = { ConnectedComponent };

function _calculate_bb_from_points_and_lines(points, lines){
    let _min_x = Infinity;
    let _min_y = Infinity;
    let _max_x = - Infinity;
    let _max_y = - Infinity;

    lines.forEach(l => {
        const { top_left, bottom_right } = l.get_bounding_box();
        
        _min_x = Math.min(top_left.x, _min_x);
        _max_x = Math.max(bottom_right.x, _max_x);
        _min_y = Math.min(top_left.y, _min_y);
        _max_y = Math.max(bottom_right.y, _max_y);
    });
    
    points.forEach(p => {
        _min_x = Math.min(p.x, _min_x);
        _max_x = Math.max(p.x, _max_x);
        _min_y = Math.min(p.y, _min_y);
        _max_y = Math.max(p.y, _max_y);
    });

    return {
        width:  _max_x - _min_x,
        height: _max_y - _min_y,
        top_left:  new Vector(_min_x, _min_y),
        top_right: new Vector(_max_x, _min_y),
        bottom_left:  new Vector(_min_x, _max_y),
        bottom_right: new Vector(_max_x, _max_y)
    }
}