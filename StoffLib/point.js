import { Vector } from './geometry.js';
import ConnectedComponent from './connected_component.js';
import assert from './assert.js';
import register_collection_methods from "./collection_methods/index.js";

class Point extends Vector{
    constructor(x, y){
        super(x, y);

        this.adjacent_lines = this.new_sketch_element_collection();
        this.data = {};
        this.sketch = null;
        this.attributes = {
            fill: "black",
            radius: 1,
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
        const r = new Point(this.x, this.y);
        r.attributes = JSON.parse(JSON.stringify(r.attributes));
        return r;
    }

    get_tangent_vector(line){
        assert.HAS_LINES(this, line);
        return line.get_tangent_vector(this);
    }

    add_adjacent_line(line){
        this.adjacent_lines.push(line);
        return this;
    }

    get_adjacent_line(){
        assert(this.adjacent_lines.length < 2, "Point has more than one adjacent line.");
        return this.adjacent_lines[0]
    }

    get_adjacent_lines(){
        return this.adjacent_lines;
    }

    get_lines(){
        return this.adjacent_lines;
    }

    // Used in Collection Elements
    get_points(){
        return [this];
    }

    get_sketch(){
        return this.sketch;
    }

    other_adjacent_line(...lines){
        const other = this.other_adjacent_lines(...lines);
        assert(other.length < 2, "Point has more than one other adjacent line.");
        return other[0] || null;
    }

    other_adjacent_lines(...lines){
        assert.HAS_LINES(this, ...lines);
        return this.adjacent_lines.filter(l => lines.indexOf(l) < 0);
    }

    common_line(point){
        return this.common_lines(point)[0] || null;
    }

    common_lines(point){
        return this.adjacent_lines.filter(l => point.get_adjacent_lines().includes(l));
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
            assert.HAS_LINES(this, l);
        }
        this.adjacent_lines = this.adjacent_lines.filter(line => line != l);
        return this;
    }

    remove(){
        assert.HAS_SKETCH(this);
        this.sketch.remove(this);
    }

    has_lines(...ls){
        for (let i = 0; i < ls.length; i++){
            if (!this.adjacent_lines.includes(ls[i])) return false;
        }
        return true;
    }

    set_sketch(s){
        if (this.sketch == null || s == null){
            this.sketch = s;
            return this;
        }
    }

    get_bounding_box(){
        return {
            width:  0,
            height: 0,
            top_left:  this,
            top_right: this,
            bottom_left:  this,
            bottom_right: this
        }
    }

    static from_vector(vec) {
        return new Point(vec.x, vec.y);
    }
}

register_collection_methods(Point);
export default Point;
