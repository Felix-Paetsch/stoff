import { Vector } from './geometry.js';
import { ConnectedComponent } from './connected_component.js';

class Point extends Vector{
    constructor(x, y, color = "black"){
        super(x, y);

        this.adjacent_lines = [];
        this.data = {};
        this.sketch = null;
        this.attributes = {
            fill: color,
            radius: 3,
            stroke: "black",
            strokeWidth: 1,
            opacity: 1
        };

        if (typeof this._init !== "undefined"){
            this._init();
        }
    }

    vector(){
        return new Vector(this);
    }

    connected_component(){
        return new ConnectedComponent(this);
    }

    set_color(color){
        this.attributes.fill = color;
        return this;
    }

    get_color(){
        return this.attributes.fill;
    }

    set_attribute(attr, value){
        this.attributes[attr] = value;
        return this;
    }

    get_attribute(attr){
        return this.attributes[attr];
    }

    copy(){
        return new Point(this.x, this.y).set_color(this.get_color());
    }

    get_tangent_vector(line){
        this.guard_has_lines(line);
        return line.get_tangent_vector(this);
    }

    add_adjacent_line(line){
        this.adjacent_lines.push(line);
        return this;
    }

    get_adjacent_lines(){
        return this.adjacent_lines;
    }

    other_adjacent_line(...lines){
        return this.other_adjacent_lines(...lines)[0] || null;
    }

    other_adjacent_lines(...lines){
        this.guard_has_lines(...lines);
        return this.adjacent_lines.filter(l => lines.indexOf(l) < 0);
    }

    common_line(point){
        return this.common_lines(point)[0] || null;
    }

    common_lines(point){
        return this.adjacent_lines.filter(l => point.adjacent_lines.includes(l));
    }

    move_to(x, y){
        return this.set(x, y);
    }

    offset_by(x, y){
        if (x instanceof Vector) {
            return this.move_to(this.add(x));
        }

        return this.move_to(this.x + x, this.y + y);
    }

    remove_line(l, ignore_not_present = false){
        if (!ignore_not_present){
            this.guard_has_lines(l);
        }
        this.adjacent_lines = this.adjacent_lines.filter(line => line != l);
        return this;
    }

    remove(){
        if (!this.sketch) throw new Error("Point doesn't belong to a sketch");
        this.sketch.remove(this);
    }

    has_lines(...ls){
        for (let i = 0; i < ls.length; i++){
            if (!this.adjacent_lines.includes(ls[i])) return false;
        }
        return true;
    }

    guard_has_lines(...ls){
        if (!this.has_lines(...ls)){
            throw new Error("Point is not connected with the line(s).");
        }
    }

    set_sketch(s, overwrite = false){
        if (this.sketch == null || overwrite || s == null){
            this.sketch = s;
            return this;
        }

        throw new Error("Point already belongs to a sketch!");
    }

    static from_vector(vec) {
        return new Point(vec.x, vec.y);
    }
}

export { Point };
