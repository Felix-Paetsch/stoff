# Sketch

The `Sketch` is the main object you will be working with. It acts a bit like a canvas where you can draw on, but also allows explicitly for constructions using already drawn lines and manipulating them. For this documentation I grouped the methods into different sections, each outlined below with a dedicated page.

```js
import { Sketch } from './Stofflib/sketch.js';
import { Point } from './Stofflib/point.js';
import { Line } from './Stofflib/line.js';
import { Vector } from './Stofflib/geometry.js';
import { ConnectedComponent } from './Stofflib/connected_component.js';
import { default_data_callback } from './Stofflib/copy.js';
type DataCallback : (Object, Object) -> Object;

class Sketch{
    constructor(){
        this.data   : Any = {};
    }
    
    // General Functionality
    get_points(){} : Point[]
    get_lines(){}  : Line[]
    remove_line(line : Line){}
    remove_lines(...lines : Line[]){}
    remove_point(pt : Point){}
    remove_points(...points : Point[]){}
    remove(...els: (Point | Line | ConnectedComponent)[]){}
    clear(){}
    
    add(
        el : Point | Vector | Line , // OR
        x, y : Number 
    ){}  : (Point | Vector | Line)

    has_points(...pt : Point[]){} : Boolean
    has_lines(...ls : Line[]){} : Boolean
    has_sketch_elements(...se : (Point | Line | ConnectedComponent)[]){} : Boolean
    has(...se : (Point | Line | ConnectedComponent)[]){} : Boolean
    
    get_bounding_box(min_bb : Number[2] = [0,0]) : {
        width, height : Number,
        top_left, top_right, bottom_left, bottom_right : Vector
    }
    
    group_by_key(key : Any){} : {
        points: Object
        lines:  Object
    }
    lines_by_key(key : Any){}  : Object
    points_by_key(key : Any){} : Object
    
    copy(){} : Sketch
    paste_sketch(
        sketch : Sketch, data_callback : DataCallback = default_data_callback, position : Vector = null
    ){} : Object

    toString(){} : "[Sketch]"
    validate_sketch(){}

    // Point Methods
    point(x: Number, y: Number){} : Point
    add_point(
        p : Point | Vector          , // OR
        x, y : Number 
    ){} : Point
    merge_points(
        pt1, pt2 : Point,
        data_callback : DataCallback = default_data_callback
    ){} : Point
    
    // Line Methods
    line_between_points(p1, p2 : Point){} : Line
    line_with_length(p1, p2 : Point, length : Number){} : Line;
    line_from_function_graph(pt1, pt2 : Point, f_1, f_2 : Number -> Number){} : Line;
    plot(pt1, pt2 : Point, f_1, f_2 : Number -> Number){} : Line;
    line_with_offset(line : Line, offset : Number, direction : Boolean = false){} : {
        p1, p2 : Point,
        line: Line
    }
    copy_line(
        line : Line, from, to : Point,
        data_callback : DataCallback = default_data_callback
    ){} : Line

    interpolate_lines(
        line1, line2 : Line, direction : Number = 0, 
        f = (x) => x, p1 = (x) => x, p2 = (x) => x : Number -> Number
    ){} : Line;
    merge_lines(
        line1, line2 : Line, 
        data_callback : DataCallback = default_data_callback
    ){} : Line

    point_on_line(
        pt : Point, line : Line, 
        data_callback : DataCallback = default_data_callback
    ){} : {
        line_segments : Line[2],
        point: Point
    }
    position_at_length(
        line : Line, length : Number, reversed : Boolean = false
    ){} : Vector
    intersect_lines(line1, line2 : Line){} :  {
        intersection_points: Points[],
        l1_segments: Line[],
        l2_segments: Line[]
    }
    intersection_positions(line1, line2 : Line){} : Vector[]

    // Connected Component Methods
    connected_component(el : Line | Point | ConnectedComponent){} : ConnectedComponent
    delete_component(el : Line | Point | ConnectedComponent){}
    get_connected_components(){} : ConnectedComponent[]
    paste_connected_component(cc : ConnectedComponent, position : Vector){} : ConnectedComponent

    // Rendering Methods
    to_svg(width, height: Number) {} : String
    to_dev_svg(width, height: Number) {} : String
    save_as_svg(fp : FilePath, width, height: Number){}
    to_png(width, height: Number) {} : String
    save_as_png(fp : FilePath, width, height: Number){}
    to_jpg(width, height: Number) {} : String
    save_as_jpg(fp : FilePath, width, height: Number){}
    save_on_A4(folder : FolderPath){}
    
    // Dev
    dev.start_recording(debug : Boolean){}
    dev.stop_recording(){} : Sketch.dev.Recording
    Sketch.dev.global_recording(){} : Sketch.dev.Recording

    dev.to_html(route : String = "/StoffLib", data : Object = null){} : String
    dev.save_as_html(path : FilePath, title : String = "/StoffLib", data : Object = null){}
    dev.at_url(url : String, data : Object = null, overwrite : Boolean = false){}
}
```

Note that some of these methods are added onto the class via prototype magic, and your linter may find this very unwielding.

To see what these methods actually do, visit the corresponding sections:

## General Functionality
A `Sketch` has associated to it points, lines and an abstract `data` object. You can directly manipulate the data object (I even encurrage you to do that) and when copying the sketch this data is also copied. It can even refer to points or lines and the references will be updated accordingly. Visit [here](#) for more on copying and data.

The method names should be self explaining, but they are also documented on a seperated page for completness.

## Point Methods
A `Point` belongs to a fixed sketch and has coordinates associated to it. Furthermore it may be the endpoint of some lines. To view more on themselves points - e.g. about different display styles - see [here.](#)

The methods here are about managing points inside a given sketch.

## Line Methods
A `Line` also belongs to a fixed sketch with endpoints also required to be inside that sketch. You should check out the [documentation on lines](#) if you haven't done so already to learn how they work and how to deal with them.

The methods here are again about managing them inside the context of a given sketch, e.g. relating lines to another or any line functionality which would modify something intrinsic to the sketch and hence can not be just a method on the class `Line`.

## Connected Component Methods
Connected components are maximal collections of points and lines between them. To learn more about them, see [here.](#)

## Rendering Methods
When you are done with creating your pattern you probably want save or display it somehow. Either as proper image, vectorgraphic, or for printing.

## Dev
During development there as another object on every `Sketch` instance one can access, namely `dev` which can really awesome to debug or just see what you are doing.
Which functionality is available depends on the enviroment you are currently using. Look at the corresponding page for more detail.