const { Vector } = require("../Geometry/geometry.js");

class Point extends Vector{
    constructor(x, y){
        super(x, y);
        
        this.adjacent_lines = [];
    }

    add_adjacent_line(line){
        this.adjacent_lines.push(line);
    }

    get_adjacent_lines(){
        return this.adjacent_lines;
    }

    moveTo(x, y){
        this.set(x,y)
    }

    remove_line(l){
        this.adjacent_lines = this.adjacent_lines.filter(line => line != l);
    }
}

module.exports = { Point };