const { Vector } = require("../Geometry/geometry.js");

class Point extends Vector{
    constructor(x, y, color = "black"){
        super(x, y);

        this.adjacent_lines = [];
        this.color = color;
    }

    set_color(color){
        this.color = color;
        return this;
    }

    get_color(){
        return this.color;
    }

    copy(){
        return new Point(this.x, this.y);
    }

    add_adjacent_line(line){
        this.adjacent_lines.push(line);
        return this;
    }

    get_adjacent_lines(){
        return this.adjacent_lines;
    }

    moveTo(x, y){
        this.set(x,y);
        return this;
    }

    remove_line(l){
        this.adjacent_lines = this.adjacent_lines.filter(line => line != l);
        return this;
    }
}

module.exports = { Point };
