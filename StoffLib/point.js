const { Vector } = require("../Geometry/geometry.js");
const { ConnectedComponent } = require("./connected_component.js");

class Point extends Vector{
    constructor(x, y, color = "black"){
        super(x, y);

        this.adjacent_lines = [];
        this.data = {};
        this.color = color;
    }

    vector(){
        return new Vector(this);
    }

    connected_component(){
        return ConnectedComponent(this);
    }

    set_color(color){
        this.color = color;
        return this;
    }

    get_color(){
        return this.color;
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

    moveTo(x, y){
        return this.set(x, y);
    }

    offsetBy(x, y){
        if (x instanceof Vector) {
            return this.moveTo(this.add(x));
        }

        return this.moveTo(this.x + x, this.y + y);
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

    static from_vector(vec) {
        return new Point(vec.x, vec.y);
    }
}

module.exports = { Point };
