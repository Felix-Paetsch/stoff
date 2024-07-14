import { Vector } from '../Geometry/geometry.js';
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
    }

    vector(){
        return new Vector(this);
    }

    connected_component(){
        return ConnectedComponent(this);
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