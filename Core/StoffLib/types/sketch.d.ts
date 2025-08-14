import Sketch from "../sketch.js";
import Point from "../point.js";
import Line from "../line.js";

declare module "../sketch.js" {
    interface Sketch {
        line_between_points(p1: Point, p2: Point): Line;
    }
}